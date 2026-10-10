import os
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.platypus import Image

def generate_qr_flowable(data_string: str, size: float = 75) -> Drawing:
    """
    Generates a scaled ReportLab Drawing flowable containing a high-contrast vector QR Code.
    """
    qr = QrCodeWidget(data_string)
    bounds = qr.getBounds()
    w = max(1.0, bounds[2] - bounds[0])
    h = max(1.0, bounds[3] - bounds[1])
    d = Drawing(size, size, transform=[size / w, 0, 0, size / h, 0, 0])
    d.add(qr)
    return d

def get_school_logo_flowable(school, max_width: float = 55, max_height: float = 55) -> Image:
    if not school or not getattr(school, 'logo', None):
        return None
    try:
        if school.logo and hasattr(school.logo, 'path'):
            logo_path = school.logo.path
            if os.path.exists(logo_path):
                return Image(logo_path, width=max_width, height=max_height)
    except Exception:
        pass
    return None
