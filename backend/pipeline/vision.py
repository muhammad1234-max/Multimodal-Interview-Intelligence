
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
        
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.emotion_model = EmotionCNN().to(self.device)
        self.emotions = ['happy', 'sad', 'neutral', 'anxious']
        
        if weights_path and os.path.exists(weights_path):
            self.emotion_model.load_state_dict(torch.load(weights_path, map_location=self.device))
            self.weights_loaded = True
        else:
            self.weights_loaded = False
            
        self.emotion_model.eval()
        
    def preprocess_face(self, face_img: np.ndarray) -> torch.Tensor:
        face_gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        face_resized = cv2.resize(face_gray, (48, 48))
        face_normalized = face_resized / 255.0
        face_tensor = torch.tensor(face_normalized, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(self.device)
        return face_tensor
        
    def process_video(self, video_path: str, num_frames: int = 30) -> Dict[str, float]:
        if not self.weights_loaded:
            raise RuntimeError("Vision model weights not loaded")
            
        cap = cv2.VideoCapture(video_path)
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
                faces = self.face_cascade.detectMultiScale(frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
                
                if len(faces) > 0:
                    (x, y, w, h) = faces[0]
                    face = frame[y:y+h, x:x+w]
                    face_tensor = self.preprocess_face(face)
                    
                    with torch.no_grad():
                        outputs = self.emotion_model(face_tensor)
                        probs = F.softmax(outputs, dim=1).cpu().numpy()[0]
                    
                    emotion_probs += probs
                    count += 1
                    
            frame_idx += 1
            
        cap.release()
        
        if count > 0:
            emotion_probs /= count
            
        return {
            'happy': float(emotion_probs[0]),
            'sad': float(emotion_probs[1]),
            'neutral': float(emotion_probs[2]),
            'anxious': float(emotion_probs[3])
        }
