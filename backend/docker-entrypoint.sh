#!/bin/sh
set -e

if [ "$1" = "gunicorn" ]; then
  python manage.py migrate --noinput
  python manage.py collectstatic --noinput 2>/dev/null || true
fi

exec "$@"
