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

# Vercel serverless expects a WSGI callable named 'app'
app = get_wsgi_application()
