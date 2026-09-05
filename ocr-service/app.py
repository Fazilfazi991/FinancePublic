import hmac
import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from paddleocr_service.engine import engine
from paddleocr_service.preprocess import prepare_image
from paddleocr_service.schemas import OcrResponse

MAX_BYTES = int(os.getenv("OCR_MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))
ALLOWED = {"image/jpeg", "image/png", "image/webp"}

@asynccontextmanager
async def lifespan(_: FastAPI):
    if os.getenv("OCR_SKIP_MODEL_INIT") != "1":
        engine.initialize()
    yield

app = FastAPI(title="ZeroDebt PaddleOCR", docs_url=None, redoc_url=None, lifespan=lifespan)

@app.get("/health")
def health():
    if not engine.healthy:
        raise HTTPException(status_code=503, detail="ocr_model_unavailable")
    return {"status": "ok"}

@app.post("/ocr", response_model=OcrResponse)
async def ocr(image: UploadFile = File(...), authorization: str | None = Header(default=None)):
    expected = os.getenv("OCR_SERVICE_API_KEY", "")
    received = authorization.removeprefix("Bearer ") if authorization else ""
    if not expected or not hmac.compare_digest(received, expected):
        raise HTTPException(status_code=401, detail="unauthorized")
    if image.content_type not in ALLOWED:
        raise HTTPException(status_code=415, detail="unsupported_image_type")
    content = await image.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="image_too_large")
    started = time.perf_counter()
    try:
        lines = engine.recognize(prepare_image(content))
    except ValueError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail="ocr_failed") from exc
    return OcrResponse(success=True, lines=lines, full_text="\n".join(line.text for line in lines)[:50_000], processing_ms=round((time.perf_counter() - started) * 1000))
