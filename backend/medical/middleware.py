import logging
import time


logger = logging.getLogger("medical.requests")


class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        started_at = time.monotonic()
        response = self.get_response(request)
        duration_ms = int((time.monotonic() - started_at) * 1000)

        logger.info(
            "request method=%s path=%s status=%s duration_ms=%s",
            request.method,
            request.get_full_path(),
            response.status_code,
            duration_ms,
        )
        return response
