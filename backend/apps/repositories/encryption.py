"""
Token encryption using Fernet (AES-128 symmetric encryption).
"""
import base64
import logging
from django.conf import settings
from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)


def _get_fernet() -> Fernet:
    key = settings.ENCRYPTION_KEY
    if not key:
        raise ValueError('ENCRYPTION_KEY is not set in settings.')
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def encrypt_token(plain_text: str) -> str:
    """Encrypt a plain text token. Returns base64 encoded ciphertext."""
    f = _get_fernet()
    return f.encrypt(plain_text.encode()).decode()


def decrypt_token(cipher_text: str) -> str:
    """Decrypt a cipher text token. Returns plain text."""
    f = _get_fernet()
    try:
        return f.decrypt(cipher_text.encode()).decode()
    except InvalidToken:
        logger.error('Failed to decrypt token — invalid token or key mismatch')
        raise ValueError('Cannot decrypt access token. The encryption key may have changed.')
