import os
import uuid
import qrcode
from app.core.config import settings

def generate_qr_code_image(data: str, filename_prefix: str = "qr") -> str:
    """Generates a QR code image file and returns its relative URL path."""
    qr_dir = os.path.join(settings.UPLOAD_DIR, "qrcodes")
    os.makedirs(qr_dir, exist_ok=True)
    
    filename = f"{filename_prefix}_{uuid.uuid4().hex[:10]}.png"
    filepath = os.path.join(qr_dir, filename)
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1e1b4b", back_color="white")
    img.save(filepath)
    
    return f"/api/v1/uploads/qrcodes/{filename}"
