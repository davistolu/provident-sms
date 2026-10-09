import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Standardizes error responses across the API.
    Returns:
    {
        "status": "error",
        "message": "Human readable summary",
        "errors": { field: [messages] } or details
    }
    """
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            exc = DRFValidationError(detail=exc.message_dict)
        elif hasattr(exc, 'messages'):
            exc = DRFValidationError(detail=exc.messages)
        else:
            exc = DRFValidationError(detail=str(exc))

    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'status': 'error',
            'status_code': response.status_code,
            'message': 'Request validation failed' if response.status_code == 400 else 'An error occurred',
            'errors': response.data
        }
        if isinstance(response.data, dict) and 'detail' in response.data:
            custom_data['message'] = str(response.data['detail'])
        response.data = custom_data
        return response

    logger.exception(f"Unhandled server exception: {exc}")
    return Response({
        'status': 'error',
        'status_code': 500,
        'message': 'A server error occurred while processing your request.',
        'errors': None
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
