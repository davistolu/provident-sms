import os
import sys
from pathlib import Path

# Resolve directory paths for Django backend and apps
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR / "apps"))

# Set Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "provi_sms.settings")

from django.core.wsgi import get_wsgi_application
from whitenoise import WhiteNoise

# Vercel serverless expects a WSGI callable named 'app'
_django_app = get_wsgi_application()

staticfiles_dir = BACKEND_DIR / "staticfiles"
if not staticfiles_dir.exists():
    staticfiles_dir.mkdir(parents=True, exist_ok=True)

app = WhiteNoise(_django_app, root=str(staticfiles_dir), prefix="static/")
