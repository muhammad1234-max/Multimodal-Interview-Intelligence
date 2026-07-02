
import numpy as np
from typing import List, Tuple
from sklearn.metrics import mean_squared_error, r2_score, f1_score, accuracy_score


def wer(reference: str, hypothesis: str) -> float:
    ref_words = reference.strip().split()
    hyp_words = hypothesis.strip().split()
    
    d = np.zeros((len(ref_words) + 1, len(hyp_words) + 1), dtype=int)
    
    for i in range(len(ref_words) + 1):
        d[i][0] = i
    for j in range(len(hyp_words) + 1):
        d[0][j] = j
        
    for i in range(1, len(ref_words) + 1):
        for j in range(1, len(hyp_words) + 1):
            cost = 0 if ref_words[i-1] == hyp_words[j-1] else 1
            d[i][j] = min(
                d[i-1][j] + 1,
                d[i][j-1] + 1,
                d[i-1][j-1] + cost
            )
    
    return d[len(ref_words)][len(hyp_words)] / len(ref_words) if ref_words else 0.0


def calculate_regression_metrics(y_true: List[float], y_pred: List[float]) -> Dict[str, float]:
    return {
        'mse': mean_squared_error(y_true, y_pred),
        'r2': r2_score(y_true, y_pred)
    }


def calculate_classification_metrics(y_true: List[int], y_pred: List[int]) -> Dict[str, float]:
    return {
        'accuracy': accuracy_score(y_true, y_pred),
        'f1': f1_score(y_true, y_pred, average='weighted')
    }
