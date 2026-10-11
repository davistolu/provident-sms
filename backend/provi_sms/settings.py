"""
Django settings for provi_sms project.
Production-ready configuration supporting multi-school tenant isolation.
"""
import os
from pathlib import Path
import sys

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Add backend folder and apps to sys.path
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / 'apps'))

# Load environment variables if .env exists
env_file = BASE_DIR / '.env'
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(env_file)

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-provi-sms-enterprise-production-key-2026-xyz-abc')

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

_raw_allowed = os.environ.get('DJANGO_ALLOWED_HOSTS', '*').strip()
if _raw_allowed == '*':
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = [h.strip() for h in _raw_allowed.split(',') if h.strip()]
    for host in ['.onrender.com', '.vercel.app', 'localhost', '127.0.0.1']:
        if host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(host)

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party packages
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'drf_spectacular',

    # Local application domain modules
    'apps.common.apps.CommonConfig',
    'apps.accounts.apps.AccountsConfig',
    'apps.schools.apps.SchoolsConfig',
    'apps.academics.apps.AcademicsConfig',
    'apps.students.apps.StudentsConfig',
    'apps.attendance.apps.AttendanceConfig',
    'apps.assessments.apps.AssessmentsConfig',
    'apps.results.apps.ResultsConfig',
    'apps.finance.apps.FinanceConfig',
    'apps.audit.apps.AuditConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.common.middleware.TenantHeaderMiddleware',
]

ROOT_URLCONF = 'provi_sms.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'provi_sms.wsgi.application'

# Database Configuration: PostgreSQL with DATABASE_URL support and SQLite fallback for local test
DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL') or os.environ.get('POSTGRES_PRISMA_URL')

if DATABASE_URL:
    try:
        import dj_database_url
        DATABASES = {
            'default': dj_database_url.config(
                default=DATABASE_URL,
                conn_max_age=600,
                conn_health_checks=True,
            )
        }
    except ImportError:
        from urllib.parse import urlparse
        url = urlparse(DATABASE_URL)
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': url.path[1:],
                'USER': url.username,
                'PASSWORD': url.password,
                'HOST': url.hostname,
                'PORT': url.port or 5432,
            }
        }
else:
    DB_ENGINE = os.environ.get('DB_ENGINE', 'django.db.backends.sqlite3')
    DB_NAME = os.environ.get('DB_NAME', str(BASE_DIR / 'db.sqlite3'))
    DB_USER = os.environ.get('DB_USER', '')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')

    if DB_ENGINE == 'django.db.backends.postgresql' or os.environ.get('USE_POSTGRES', 'False').lower() in ('true', '1'):
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': DB_NAME,
                'USER': DB_USER or 'postgres',
                'PASSWORD': DB_PASSWORD,
                'HOST': DB_HOST,
                'PORT': DB_PORT,
            }
        }
    else:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }

# Password validation (Hardened)
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Settings (Hardened with Throttling & Rate Limiting)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '300/min',
        'auth': '10/min',
        'file_upload': '20/min',
        'pdf_export': '30/min',
    },
    'DEFAULT_PAGINATION_CLASS': 'apps.common.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'apps.common.exceptions.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%SZ',
}

# Spectacular API Docs Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'PROVI School Management System API',
    'DESCRIPTION': 'Production-ready REST API for School Administration, Academics, Attendance, Results & Finance.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SERVE_PERMISSIONS': ['rest_framework.permissions.IsAdminUser'] if not DEBUG else [],
}

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

cors_extra = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if cors_extra:
    CORS_ALLOWED_ORIGINS.extend([origin.strip() for origin in cors_extra.split(',') if origin.strip()])

# Allow any Vercel deployment preview or production domain
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]

CORS_ALLOW_CREDENTIALS = True

from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-school-id',
    'x-school-slug',
]

# Security Headers & Defense-in-Depth
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_HTTPONLY = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
