# Use official Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Set environment variables to prevent pyc files and buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Hugging Face Spaces port requirement
ENV PORT=7860

# Install system dependencies (ffmpeg is required for librosa and audio processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
# We use --no-cache-dir to keep the image size small
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Verify OpenCV loads correctly (will fail the build early if not)
RUN python -c "import cv2; print('CV2 Version:', cv2.__version__); print('Has CascadeClassifier:', hasattr(cv2, 'CascadeClassifier'))"

# Copy backend source code
COPY . .

# Expose port
EXPOSE 7860

# Start server using uvicorn (using api:app based on start_server.py)
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
