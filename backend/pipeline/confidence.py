
import torch
import os
import sys
import pickle
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.confidence_ann import ConfidenceANN
from typing import Dict, Tuple


class ConfidencePredictor:
    def __init__(self, weights_path: str = None, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        
        self.model = ConfidenceANN().to(self.device)
        self.scaler = None
        self.weights_loaded = False
        
        if weights_path and os.path.exists(weights_path):
            self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
            self.weights_loaded = True
            
            # Load the scaler so inputs match training distribution
            scaler_path = os.path.join(os.path.dirname(weights_path), 'confidence_scaler.pkl')
            if os.path.exists(scaler_path):
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
            
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
        
        if self.scaler:
            import numpy as np
            features_array = np.array(features).reshape(1, -1)
            scaled_features = self.scaler.transform(features_array)
            features = scaled_features[0].tolist()
            
        return torch.tensor(features, dtype=torch.float32).unsqueeze(0).to(self.device)
        
    def predict(self, audio_features: Dict, emotion_probs: Dict) -> Tuple[int, str, float]:
        if not self.weights_loaded:
            raise RuntimeError("Confidence model weights not loaded")
            
        input_tensor = self.prepare_input(audio_features, emotion_probs)
        confidence_class, probs = self.model.predict_with_probs(input_tensor)
        confidence_probability = probs[confidence_class]
            
        confidence_labels = ['Low', 'Medium', 'High']
        return confidence_class, confidence_labels[confidence_class], float(confidence_probability)
