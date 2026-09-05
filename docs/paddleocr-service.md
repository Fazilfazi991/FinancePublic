# PaddleOCR service

## Architecture

Telegram sends an image to the existing Vercel webhook. Vercel downloads it from Telegram, sends the bytes to this private service, normalizes the OCR response, and creates a pending confirmation draft. The image is never placed in Supabase and is discarded after the request.

The service uses PaddleOCR 3.7.0 with CPU-default PP-OCRv6 small detection and recognition models. It intentionally does not use PP-Structure or a document VLM.

## Local setup

```powershell
cd ocr-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:OCR_SERVICE_API_KEY="a-long-random-development-key"
uvicorn app:app --host 0.0.0.0 --port 8000
```

Check `GET /health`. Send a synthetic JPG, PNG, or WEBP as multipart field `image` to `POST /ocr` with `Authorization: Bearer <key>`. Never use a real financial screenshot as a committed fixture.

## Environment

- `OCR_SERVICE_API_KEY` (required)
- `PORT` (default 8000)
- `OCR_LANGUAGE` (default `en`)
- `OCR_DEVICE` (default `cpu`)
- `OCR_MAX_IMAGE_BYTES` (default 10 MB)

Vercel requires matching server-only `OCR_SERVICE_URL` and `OCR_SERVICE_API_KEY`. Optional: `OCR_SERVICE_TIMEOUT_MS` and `TELEGRAM_IMAGE_RATE_LIMIT`.

## API

`POST /ocr` returns `success`, at most 250 `{text, confidence, box}` lines, truncated `full_text`, and `processing_ms`. `/ocr` requires constant-time bearer authentication. `/health` returns 200 only after model initialization succeeds.

## Container deployment

Build with `docker build -t zerodebt-ocr ./ocr-service`. Use a container host with HTTPS, persistent model cache where possible, at least 2 CPU cores, and approximately 2–4 GB RAM for a comfortable CPU deployment. Measure memory and latency on the chosen host before production sizing. No hosting provider or paid service is selected by this repository.

## Privacy and retention

The service processes request bytes in memory. It does not persist images or OCR text and must not log either. The Finance application stores only content/file hashes, a hashed transaction reference, safe processing metrics, and the normalized draft required for confirmation.
