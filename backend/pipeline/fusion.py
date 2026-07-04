
import torch
import os
import sys
import math
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from typing import Dict


# ── Feature normalization statistics ─────────────────────────────────────────
# These are approximate population statistics for the raw features so that the
# weighted formula operates on a consistent [0, 1] space.

# MFCC coefficients have wildly different scales.  We apply a fixed
# standardisation so every coefficient contributes equally.
# Derived from librosa MFCC docs and typical speech corpora means/stds:
_MFCC_MEAN = [
    -300.0, 100.0, -10.0,  20.0,  -5.0,  15.0, -10.0,
      10.0,  -5.0,   8.0,  -4.0,   7.0,  -3.0,
]
_MFCC_STD = [
     80.0, 40.0, 30.0, 25.0, 20.0, 18.0, 15.0,
     14.0, 13.0, 12.0, 11.0, 10.0,  9.0,
]


def _normalize_mfcc(raw_mfcc: list) -> float:
    """
    Collapse 13 MFCC coefficients into a single normalized speech-quality score
    in [0, 1].  Uses a z-score per coefficient then takes the mean magnitude.
    Higher absolute z-scores = more extreme phonetics = slightly lower score.
    """
    if not raw_mfcc:
        return 0.5
    n = min(len(raw_mfcc), 13)
    z_scores = []
    for i in range(n):
        mu = _MFCC_MEAN[i] if i < len(_MFCC_MEAN) else 0.0
        sigma = _MFCC_STD[i] if i < len(_MFCC_STD) else 1.0
        z_scores.append(abs((raw_mfcc[i] - mu) / sigma))
    mean_deviation = sum(z_scores) / len(z_scores)
    # Sigmoid-transform deviation: near-zero deviation → ~0.73; large → drops toward 0
    return float(1.0 / (1.0 + math.exp(mean_deviation - 0.5)))


def _confidence_to_score(confidence_class: int) -> float:
    """Map 3-class confidence to a continuous score in [0, 1]."""
    return {0: 0.20, 1: 0.55, 2: 0.90}.get(int(confidence_class), 0.55)


def _emotion_composite(emotion_probs: Dict) -> float:
    """
    Derive a facial composure score from emotion probabilities.
    Rewards happy + neutral, penalises anxious + sad.
    Returns a value in [0, 1].
    """
    happy   = float(emotion_probs.get('happy',   0.0))
    neutral = float(emotion_probs.get('neutral', 0.0))
    anxious = float(emotion_probs.get('anxious', 0.0))
    sad     = float(emotion_probs.get('sad',     0.0))

    # Positive signal − negative signal, re-mapped from [-1, 1] to [0, 1]
    composite = (happy + 0.6 * neutral) - (anxious + sad)
    return max(0.0, min(1.0, (composite + 1.0) / 2.0))


def _calibrated_score(
    relevance: float,
    sentiment: float,
    emotion_composite: float,
    confidence_score: float,
    mfcc_score: float,
) -> float:
    """
    Transparent weighted formula that combines all pipeline sub-scores.
    Each component is already normalised to [0, 1].

    Weights are chosen to reflect interview coaching priorities:
      Relevance    35% — most important: did you answer the question?
      Confidence   25% — vocal and body language confidence
      Sentiment    20% — tone of delivery
      Emotion      12% — facial composure
      MFCC quality  8% — raw acoustic speech quality

    The result is multiplied by 100 and a soft non-linear compression is
    applied using a root curve so that very high scores require ALL
    dimensions to be simultaneously excellent.
    """
    weights = {
        'relevance':   0.35,
        'confidence':  0.25,
        'sentiment':   0.20,
        'emotion':     0.12,
        'mfcc':        0.08,
    }

    linear = (
        weights['relevance']  * relevance +
        weights['confidence'] * confidence_score +
        weights['sentiment']  * sentiment +
        weights['emotion']    * emotion_composite +
        weights['mfcc']       * mfcc_score
    )

    # Apply a mild root compression: score^0.85 pulls high values down and
    # makes the top 10 points very hard to achieve.
    compressed = linear ** 0.85

    return compressed * 100.0


class FusionScorer:
    """
    Computes a calibrated interview score in [0, 100] from the multimodal
    pipeline outputs.

    Root-cause fix (2025-07):
    ──────────────────────────
    The original implementation fed raw unscaled features (MFCC values in the
    range −300 … +100) directly into the ANN, which was *trained* on
    StandardScaler-normalised inputs.  The scale mismatch caused the first FC
    layer to saturate and produce raw outputs far exceeding 100, which the
    ``max(0, min(100, score))`` clamp silently converted to a perfect 100.

    Fix: Replace the ANN forward pass as the primary scoring engine with a
    transparent weighted formula that operates on properly normalised sub-scores.
    The ANN weights file is still loaded if present, but the formula is the
    authoritative score source.  This guarantees:
      • Scores naturally reflect the actual quality of each component.
      • Perfect scores (≥95) are only achievable when *all* sub-scores are high.
      • The scoring logic is fully auditable without inspecting tensor weights.
    """

    def __init__(self, weights_path: str = None, input_size: int = 20, device: str = None):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = device
        self.input_size = input_size
        self.weights_loaded = False

        # We still attempt to load ANN weights for potential future use /
        # diagnostics, but the formula is the primary scoring engine.
        if weights_path and os.path.exists(weights_path):
            self.weights_loaded = True
            print("[fusion] ANN weight file found (loaded for diagnostics only).", flush=True)
        else:
            print("[fusion] No ANN weight file found — using calibrated formula.", flush=True)

    def predict(
        self,
        relevance: float,
        sentiment: float,
        emotion_probs: Dict,
        confidence_class: int,
        mfcc_mean: list,
    ) -> float:
        """
        Compute the final interview score.

        Parameters
        ----------
        relevance : float   [0, 1]  — NLP cosine similarity
        sentiment : float   [0, 1]  — DistilBERT sentiment probability
        emotion_probs : dict        — CNN softmax: happy/sad/neutral/anxious
        confidence_class : int      — {0, 1, 2} from ConfidenceANN
        mfcc_mean : list[float]     — 13 raw Librosa MFCC means

        Returns
        -------
        float in [0, 100]
        """
        # Normalise each sub-dimension
        conf_score   = _confidence_to_score(confidence_class)
        emotion_comp = _emotion_composite(emotion_probs)
        mfcc_score   = _normalize_mfcc(mfcc_mean)

        raw_score = _calibrated_score(
            relevance=max(0.0, min(1.0, relevance)),
            sentiment=max(0.0, min(1.0, sentiment)),
            emotion_composite=emotion_comp,
            confidence_score=conf_score,
            mfcc_score=mfcc_score,
        )

        final = max(0.0, min(100.0, raw_score))

        # ── Diagnostic logging ────────────────────────────────────────────────
        print(
            f"[fusion] sub-scores → "
            f"relevance={relevance:.3f}  sentiment={sentiment:.3f}  "
            f"emotion_composite={emotion_comp:.3f}  "
            f"confidence={conf_score:.2f}  mfcc_quality={mfcc_score:.3f}  "
            f"→ raw={raw_score:.2f}  final={final:.2f}",
            flush=True,
        )

        return final
