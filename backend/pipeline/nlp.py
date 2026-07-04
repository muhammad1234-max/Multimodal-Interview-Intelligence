
import torch
from transformers import AutoTokenizer, AutoModel, pipeline
import numpy as np
from typing import Tuple


class NLPProcessor:
    def __init__(self, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        
        # Use asymmetric QA embeddings instead of symmetric DistilBERT
        model_name = 'sentence-transformers/multi-qa-MiniLM-L6-cos-v1'
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        self.sentiment_analyzer = pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english', device=0 if self.device == "cuda" else -1)
        
    def get_embedding(self, text: str) -> np.ndarray:
        inputs = self.tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=512).to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
            
        # Proper mean pooling accounting for attention mask
        token_embeddings = outputs.last_hidden_state
        attention_mask = inputs['attention_mask']
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        
        sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
        sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
        pooled_embedding = sum_embeddings / sum_mask
        
        return pooled_embedding.cpu().numpy()
    
    def compute_relevance(self, candidate_answer: str, reference_answer: str) -> float:
        if not candidate_answer.strip():
            return 0.0
            
        candidate_emb = self.get_embedding(candidate_answer).flatten()
        reference_emb = self.get_embedding(reference_answer).flatten()
        
        norm_c = np.linalg.norm(candidate_emb)
        norm_r = np.linalg.norm(reference_emb)
        
        if norm_c > 0 and norm_r > 0:
            similarity = np.dot(candidate_emb, reference_emb) / (norm_c * norm_r)
        else:
            similarity = 0.0
            
        # multi-qa-MiniLM-L6-cos-v1 outputs cosine similarities generally between 0 and 1, 
        # but can be negative for highly opposing semantics. 
        # Normalize to strictly [0, 1] range:
        return float(max(0.0, min(1.0, (similarity + 1.0) / 2.0)))
    
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
