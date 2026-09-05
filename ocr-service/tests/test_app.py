import os
os.environ["OCR_SERVICE_API_KEY"] = "test-key"
os.environ["OCR_SKIP_MODEL_INIT"] = "1"
from fastapi.testclient import TestClient
from app import app, engine
from paddleocr_service.schemas import OcrLine

def test_health_and_authenticated_ocr(monkeypatch):
    monkeypatch.setattr(type(engine), "healthy", property(lambda self: True))
    monkeypatch.setattr(engine, "recognize", lambda image: [OcrLine(text="Total INR 500", confidence=.98)])
    with TestClient(app) as client:
        response = client.post("/ocr", headers={"Authorization":"Bearer test-key"}, files={"image":("sample.png", minimal_png(), "image/png")})
        assert response.status_code == 200
        assert response.json()["lines"][0]["text"] == "Total INR 500"

def test_rejects_bad_key():
    with TestClient(app) as client:
        response = client.post("/ocr", files={"image":("sample.png", minimal_png(), "image/png")})
        assert response.status_code == 401

def minimal_png():
    import base64
    return base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")
