
import torch
from transformers import DistilBertTokenizer, DistilBertModel, pipeline
import numpy as np
from typing import Dict, Tuple


class NLPProcessor:
    def __init__(self, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        
        self.tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
        self.model = DistilBertModel.from_pretrained('distilbert-base-uncased').to(self.device)
        self.sentiment_analyzer = pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english', device=0 if self.device == "cuda" else -1)
        
    def get_embedding(self, text: str) -> np.ndarray:
        inputs = self.tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=512).to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
        return outputs.last_hidden_state.mean(dim=1).cpu().numpy()
    
    def compute_relevance(self, candidate_answer: str, reference_answer: str) -> float:
        candidate_emb = self.get_embedding(candidate_answer).flatten()
        reference_emb = self.get_embedding(reference_answer).flatten()
        norm_c = np.linalg.norm(candidate_emb)
        norm_r = np.linalg.norm(reference_emb)
        if norm_c > 0 and norm_r > 0:
            similarity = np.dot(candidate_emb, reference_emb) / (norm_c * norm_r)
        else:
            similarity = 0.0
        return float((similarity + 1) / 2)  # Normalize to [0,1]
    
    def compute_sentiment(self, text: str) -> float:
        result = self.sentiment_analyzer(text)[0]
        score = result['score']
        if result['label'] == 'NEGATIVE':
            score = 1 - score
        return float(score)
    
    def process_text(self, candidate_answer: str, reference_answer: str) -> Tuple[float, float]:
        relevance = self.compute_relevance(candidate_answer, reference_answer)
        sentiment = self.compute_sentiment(candidate_answer)
        return relevance, sentiment
