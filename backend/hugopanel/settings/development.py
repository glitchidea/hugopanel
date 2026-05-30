from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ['*']

# ── Dev-only apps ───────────────────────────────────────────
INSTALLED_APPS += []  # noqa: F405

# ── Django debug toolbar (optional) ────────────────────────
CORS_ALLOW_ALL_ORIGINS = True

# ── Email backend ───────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ── Logging ─────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
