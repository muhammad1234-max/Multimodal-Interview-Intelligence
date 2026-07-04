import logging
import json
import contextvars
from datetime import datetime, timezone
import uuid

# Context variable to hold the Request-ID for the current async task
request_id_var = contextvars.ContextVar("request_id", default=None)

def get_request_id() -> str:
    """Retrieve the current request ID or generate a new one if missing."""
    req_id = request_id_var.get()
    if not req_id:
        req_id = f"req-{uuid.uuid4().hex[:8]}"
        request_id_var.set(req_id)
    return req_id

class JSONFormatter(logging.Formatter):
    """Formats log records as structured JSON."""
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "request_id": request_id_var.get() or "system",
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Include exception traceback if available
        if record.exc_info:
            log_obj["error"] = self.formatException(record.exc_info)
            
        # Add any extra kwargs passed to the logger
        if hasattr(record, "extra_data"):
            log_obj.update(record.extra_data)
            
        return json.dumps(log_obj)

def get_structured_logger(name: str) -> logging.Logger:
    """Returns a logger configured for structured JSON output."""
    logger = logging.getLogger(name)
    
    # Avoid duplicating handlers if logger is already configured
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)
        logger.propagate = False
        
    return logger
