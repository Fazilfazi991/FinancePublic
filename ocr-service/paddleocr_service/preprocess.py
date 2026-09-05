from io import BytesIO
from PIL import Image, ImageEnhance, ImageOps
import numpy as np

MAX_PIXELS = 20_000_000
MAX_DIMENSION = 3000

def prepare_image(content: bytes) -> np.ndarray:
    image = Image.open(BytesIO(content))
    image = ImageOps.exif_transpose(image).convert("RGB")
    if image.width * image.height > MAX_PIXELS:
        raise ValueError("image_dimensions_too_large")
    image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)
    image = ImageEnhance.Contrast(image).enhance(1.05)
    return np.asarray(image)
