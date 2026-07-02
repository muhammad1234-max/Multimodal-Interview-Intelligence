
import torch
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.scoring_ann import InterviewScoringANN
from typing import Dict


class FusionScorer:
    def __init__(self, weights_path: str = None, input_size: int = 20, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        self.input_size = input_size
        
        self.model = InterviewScoringANN(input_size=input_size).to(self.device)
        
        if weights_path and os.path.exists(weights_path):
            self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
            self.weights_loaded = True
        else:
            self.weights_loaded = False
            
        self.model.eval()
        
    def prepare_input(self, relevance: float, sentiment: float, emotion_probs: Dict, 
                     confidence_class: int, mfcc_mean: list) -> torch.Tensor:
        features = []
        features.append(relevance)
        features.append(sentiment)
        features.append(emotion_probs['happy'])
        features.append(emotion_probs['sad'])
        features.append(emotion_probs['neutral'])
        features.append(emotion_probs['anxious'])
        features.append(float(confidence_class))
        features.extend(mfcc_mean)
        
        if len(features) < self.input_size:
            features.extend([0.0] * (self.input_size - len(features)))
        elif len(features) > self.input_size:
            features = features[:self.input_size]
            
        return torch.tensor(features, dtype=torch.float32).unsqueeze(0).to(self.device)
        
    def predict(self, relevance: float, sentiment: float, emotion_probs: Dict, 
                confidence_class: int, mfcc_mean: list) -> float:
        input_tensor = self.prepare_input(relevance, sentiment, emotion_probs, confidence_class, mfcc_mean)
        
        if self.weights_loaded:
            score = self.model.predict(input_tensor)
        else:
            score = 50.0
            
        score = max(0.0, min(100.0, score))
        return score
