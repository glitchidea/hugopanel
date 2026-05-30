"""
Hugo front matter parser using python-frontmatter.
Supports YAML (---), TOML (+++) and JSON ({}) front matter.
"""
import logging
from datetime import date, datetime
from typing import Optional

import frontmatter

logger = logging.getLogger(__name__)


def parse_post(raw_content: str) -> dict:
    """
    Parse a Hugo markdown file.
    Returns a dict with:
      - front_matter: dict of all front matter fields
      - content: markdown body (without front matter)
      - format: 'yaml' | 'toml' | 'json' | 'unknown'
    """
    try:
        post = frontmatter.loads(raw_content)
        metadata = dict(post.metadata)

        # Normalize common fields
        known_fields = {'title', 'date', 'draft', 'description', 'tags',
                        'categories', 'author', 'slug', 'image', 'weight'}
        extra_fields = {k: v for k, v in metadata.items() if k not in known_fields}

        # Detect format
        fmt = _detect_format(raw_content)

        # Normalize date
        parsed_date = metadata.get('date')
        if isinstance(parsed_date, (date, datetime)):
            parsed_date = parsed_date.isoformat()

        return {
            'front_matter': {
                'title': metadata.get('title', ''),
                'date': parsed_date or '',
                'draft': metadata.get('draft', False),
                'description': metadata.get('description', ''),
                'tags': _ensure_list(metadata.get('tags', [])),
                'categories': _ensure_list(metadata.get('categories', [])),
                'author': metadata.get('author', ''),
                'slug': metadata.get('slug', ''),
                'image': metadata.get('image', ''),
                'weight': metadata.get('weight', 0),
                **extra_fields,
            },
            'content': post.content,
            'format': fmt,
        }
    except Exception as e:
        logger.warning(f'Failed to parse front matter: {e}')
        return {
            'front_matter': {'title': '', 'date': '', 'draft': False},
            'content': raw_content,
            'format': 'unknown',
        }


def build_post(front_matter: dict, content: str, fmt: str = 'yaml') -> str:
    """
    Build a Hugo markdown file string from front_matter dict and content.
    Preserves original format (yaml/toml/json).
    """
    post = frontmatter.Post(content, **front_matter)

    if fmt == 'toml':
        return frontmatter.dumps(post, handler=frontmatter.TOMLHandler())
    elif fmt == 'json':
        return frontmatter.dumps(post, handler=frontmatter.JSONHandler())
    else:
        return frontmatter.dumps(post)


def _detect_format(raw: str) -> str:
    stripped = raw.lstrip()
    if stripped.startswith('---'):
        return 'yaml'
    if stripped.startswith('+++'):
        return 'toml'
    if stripped.startswith('{'):
        return 'json'
    return 'yaml'


def _ensure_list(val) -> list:
    if val is None:
        return []
    if isinstance(val, list):
        return val
    return [val]
