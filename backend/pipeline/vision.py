
import cv2
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict
import os


class EmotionCNN(nn.Module):
    def __init__(self):
        super(EmotionCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)
        self.fc1 = nn.Linear(64 * 12 * 12, 64)
        self.fc2 = nn.Linear(64, 4)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.pool1(F.relu(self.conv1(x)))
        x = self.pool2(F.relu(self.conv2(x)))
        x = x.view(-1, 64 * 12 * 12)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x


class VisionProcessor:
    def __init__(self, weights_path: str = None, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device

        # Attempt to initialise the Haar cascade face detector.
        # On some headless / stripped-down OpenCV builds (e.g. Hugging Face Spaces)
        # cv2.CascadeClassifier is not exposed. We catch that here and fall back
        # to a simple centre-crop strategy so the rest of the pipeline keeps running.
        self.face_cascade = None
        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            print("[vision] CascadeClassifier loaded successfully.", flush=True)
        except (AttributeError, cv2.error) as e:
            print(f"[vision] WARNING: CascadeClassifier unavailable ({e}). "
                  "Falling back to centre-crop face extraction.", flush=True)

        self.emotion_model = EmotionCNN().to(self.device)
        self.emotions = ["happy", "sad", "neutral", "anxious"]

        if weights_path and os.path.exists(weights_path):
            self.emotion_model.load_state_dict(
                torch.load(weights_path, map_location=self.device, weights_only=True)
            )
            self.weights_loaded = True
            print(f"[vision] Emotion weights loaded from {weights_path}", flush=True)
        else:
            self.weights_loaded = False
            print(f"[vision] WARNING: Weights not found at {weights_path}", flush=True)

        self.emotion_model.eval()

    def _extract_face_region(self, frame: np.ndarray) -> np.ndarray:
        """
        Return the best candidate face region from a frame.
        Primary strategy : Haar cascade face detection.
        Fallback strategy: centre-crop (upper-centre 40 % of height × 60 % of width),
                           which covers the face area in typical webcam interview shots.
        """
        if self.face_cascade is not None:
            try:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(
                    gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
                )
                if len(faces) > 0:
                    (x, y, w, h) = faces[0]
                    return frame[y : y + h, x : x + w]
            except Exception:
                pass  # cascade failed on this frame — fall through to crop

        # Centre-crop fallback
        h, w = frame.shape[:2]
        y_start = int(h * 0.05)
        y_end = int(h * 0.55)
        x_start = int(w * 0.20)
        x_end = int(w * 0.80)
        return frame[y_start:y_end, x_start:x_end]

    def preprocess_face(self, face_img: np.ndarray) -> torch.Tensor:
        face_gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        face_resized = cv2.resize(face_gray, (48, 48))
        face_normalized = face_resized / 255.0
        face_tensor = (
            torch.tensor(face_normalized, dtype=torch.float32)
            .unsqueeze(0)
            .unsqueeze(0)
            .to(self.device)
        )
        return face_tensor

    def process_video(self, video_path: str, num_frames: int = 30) -> Dict[str, float]:
        if not self.weights_loaded:
            raise RuntimeError("Vision model weights not loaded")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video file: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_interval = max(1, total_frames // num_frames)

        emotion_probs = np.zeros(4)
        count = 0
        frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                try:
                    face_region = self._extract_face_region(frame)
                    if face_region.size == 0:
                        frame_idx += 1
                        continue
                    face_tensor = self.preprocess_face(face_region)
                    with torch.no_grad():
                        outputs = self.emotion_model(face_tensor)
                        probs = F.softmax(outputs, dim=1).cpu().numpy()[0]
                    emotion_probs += probs
                    count += 1
                except Exception as frame_err:
                    print(f"[vision] Frame {frame_idx} skipped: {frame_err}", flush=True)

            frame_idx += 1

        cap.release()

        if count > 0:
            emotion_probs /= count
        else:
            # If no frames were processed at all, return a neutral-biased default
            print("[vision] WARNING: No frames processed. Returning neutral default.", flush=True)
            emotion_probs = np.array([0.1, 0.1, 0.7, 0.1])

        return {
            "happy": float(emotion_probs[0]),
            "sad": float(emotion_probs[1]),
            "neutral": float(emotion_probs[2]),
            "anxious": float(emotion_probs[3]),
        }
