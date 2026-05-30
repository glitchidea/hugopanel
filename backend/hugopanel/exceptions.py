"""
Custom exception handler for standardized API responses.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'success': False,
            'error': {
                'code': _get_error_code(response.status_code),
                'message': _extract_message(response.data),
                'details': response.data if isinstance(response.data, dict) else {},
            }
        }
        response.data = error_data

    return response


def _get_error_code(status_code):
    codes = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        429: 'RATE_LIMITED',
        500: 'INTERNAL_ERROR',
    }
    return codes.get(status_code, f'HTTP_{status_code}')


def _extract_message(data):
    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        for key in ('detail', 'message', 'non_field_errors'):
            if key in data:
                val = data[key]
                if isinstance(val, list):
                    return str(val[0])
                return str(val)
        return str(next(iter(data.values()), 'An error occurred'))
    if isinstance(data, list):
        return str(data[0])
    return 'An error occurred'
