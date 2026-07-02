
import torch
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.confidence_ann import ConfidenceANN
from typing import Dict, Tuple


class ConfidencePredictor:
    def __init__(self, weights_path: str = None, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        
        self.model = ConfidenceANN().to(self.device)
        
        if weights_path and os.path.exists(weights_path):
            self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
            self.weights_loaded = True
        else:
            self.weights_loaded = False
            
        self.model.eval()
        
    def prepare_input(self, audio_features: Dict, emotion_probs: Dict) -> torch.Tensor:
        features = []
        features.extend(audio_features['mfcc_mean'])
        features.append(audio_features['pitch_variance'])
        features.append(audio_features['energy'])
        features.append(audio_features['speech_rate'])
        features.append(emotion_probs['happy'])
        features.append(emotion_probs['sad'])
        features.append(emotion_probs['neutral'])
        features.append(emotion_probs['anxious'])
        
        return torch.tensor(features, dtype=torch.float32).unsqueeze(0).to(self.device)
        
    def predict(self, audio_features: Dict, emotion_probs: Dict) -> Tuple[int, str]:
        input_tensor = self.prepare_input(audio_features, emotion_probs)
        
        if self.weights_loaded:
            confidence_class = self.model.predict(input_tensor)
        else:
            confidence_class = 1
            
        confidence_labels = ['Low', 'Medium', 'High']
        return confidence_class, confidence_labels[confidence_class]
