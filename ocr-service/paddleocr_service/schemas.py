from pydantic import BaseModel

class OcrLine(BaseModel):
    text: str
    confidence: float
    box: list[list[float]] | None = None

class OcrResponse(BaseModel):
    success: bool
    lines: list[OcrLine]
    full_text: str
    processing_ms: int
