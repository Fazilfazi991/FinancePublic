# Telegram receipt image entry

Supported inputs are Telegram photos and JPEG, PNG, or WEBP documents up to 10 MB. The webhook verifies Telegram, resolves the linked user and account using the existing shared resolver, downloads the file server-side, calls the private PaddleOCR service, and normalizes amount, merchant, status, date, and category.

Failed or pending payments are never confirmable. Successful/unknown receipts produce the existing Confirm/Edit/Cancel draft; confirmation alone writes the transaction with source `telegram_image`. Edit cancels the image draft and asks for corrected text.

Duplicate protection uses Telegram `file_unique_id`, SHA-256 of the bytes, and a SHA-256 transaction-reference fingerprint. Raw references, full OCR text, UPI identifiers, and images are not retained. Image processing is independently limited to five requests per Telegram user per minute by default.

If `OCR_SERVICE_URL` or `OCR_SERVICE_API_KEY` is absent, image entry returns a configuration message without affecting text entry. The normalizer and server-only OCR client can later be reused by a WhatsApp adapter without changing their privacy boundary.
