
import numpy as np
from typing import List, Dict


def normalize_features(features: np.ndarray, mean: np.ndarray = None, std: np.ndarray = None) -> np.ndarray:
    if mean is None:
        mean = np.mean(features, axis=0)
    if std is None:
        std = np.std(features, axis=0)
        std[std == 0] = 1
    return (features - mean) / std


def pad_sequences(sequences: List[np.ndarray], max_len: int = None) -> np.ndarray:
    if max_len is None:
        max_len = max(len(seq) for seq in sequences)
    padded = []
    for seq in sequences:
        if len(seq) < max_len:
            pad = np.zeros((max_len - len(seq),) + seq.shape[1:])
            padded_seq = np.vstack([seq, pad])
        else:
            padded_seq = seq[:max_len]
        padded.append(padded_seq)
    return np.array(padded)
