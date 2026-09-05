import os
from threading import Lock
from paddleocr import PaddleOCR
from .schemas import OcrLine

class OcrEngine:
    def __init__(self) -> None:
        self._lock = Lock()
        self._engine = None
        self.error: str | None = None

    def initialize(self) -> None:
        try:
            self._engine = PaddleOCR(
                lang=os.getenv("OCR_LANGUAGE", "en"),
                device=os.getenv("OCR_DEVICE", "cpu"),
                text_detection_model_name="PP-OCRv6_small_det",
                text_recognition_model_name="PP-OCRv6_small_rec",
                use_doc_orientation_classify=True,
                use_doc_unwarping=False,
                use_textline_orientation=True,
            )
        except Exception as exc:
            self.error = type(exc).__name__

    @property
    def healthy(self) -> bool:
        return self._engine is not None and self.error is None

    def recognize(self, image) -> list[OcrLine]:
        if not self._engine:
            raise RuntimeError("ocr_model_unavailable")
        with self._lock:
            results = self._engine.predict(image)
        lines: list[OcrLine] = []
        for result in results:
            data = result.json.get("res", result.json) if hasattr(result, "json") else {}
            texts = data.get("rec_texts", [])
            scores = data.get("rec_scores", [])
            boxes = data.get("rec_polys", [])
            for index, text in enumerate(texts):
                if text and len(lines) < 250:
                    box = boxes[index].tolist() if index < len(boxes) and hasattr(boxes[index], "tolist") else (boxes[index] if index < len(boxes) else None)
                    lines.append(OcrLine(text=str(text)[:500], confidence=float(scores[index]) if index < len(scores) else 0.0, box=box))
        return lines

engine = OcrEngine()
