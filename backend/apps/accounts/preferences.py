"""
User preference helpers — resolve UI-stored settings with .env fallbacks.
"""
from django.conf import settings


def get_git_author_name(user) -> str:
    name = (getattr(user, 'git_author_name', None) or '').strip()
    if name:
        return name
    return getattr(settings, 'GIT_AUTHOR_NAME', 'HugoPanel')


def get_git_author_email(user) -> str:
    email = (getattr(user, 'git_author_email', None) or '').strip()
    if email:
        return email
    return getattr(settings, 'GIT_AUTHOR_EMAIL', 'hugopanel@noreply.com')


def format_commit_message(template: str, *, action: str, file: str) -> str:
    """Apply {action} and {file} placeholders from the user's commit template."""
    return (
        template.replace('{action}', action).replace('{file}', file).strip()
    )
