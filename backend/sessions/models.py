"""
Pydantic models for Interview Sessions.
Strict contracts — no database logic here.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Sub-models ─────────────────────────────────────────────────────────────────

class AudioFeaturesModel(BaseModel):
    """Mirrors the dict returned by pipeline.speech.process_audio."""
    mfcc_mean: list[float]
    pitch_variance: float
    energy: float
    speech_rate: float
    duration: float


class FeedbackModel(BaseModel):
    """AI-generated qualitative feedback, computed server-side from results."""
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]


class MetricExplanation(BaseModel):
    """Human-readable explanation for a specific AI metric."""
    score_label: str
    explanation: str
    recommendation: str


class ExplanationsModel(BaseModel):
    """Collection of detailed explanations for all major pipeline metrics."""
    speech: Optional[MetricExplanation] = None
    confidence: Optional[MetricExplanation] = None
    emotion: Optional[MetricExplanation] = None
    relevance: Optional[MetricExplanation] = None
    sentiment: Optional[MetricExplanation] = None
    overall: Optional[MetricExplanation] = None


class ModelMetadata(BaseModel):
    """Developer-only transparency payload tracking AI pipeline execution details."""
    model_name: str
    version: str
    inference_time_ms: float
    weights_loaded: bool
    device: str
    feature_vector_size: Optional[int] = None
    execution_status: str  # e.g., "Success", "Failed", "Bypassed"
    confidence_score: Optional[float] = None
    reason: Optional[str] = None


class VideoMetadata(BaseModel):
    """Metadata extracted from the uploaded video file."""
    filename: str
    size_bytes: Optional[int] = None
    content_type: Optional[str] = None


# ── Database Models ───────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    """Passed to SessionService.create() — contains everything needed to persist."""
    user_id: str
    question: str
    video: VideoMetadata

    # Pipeline outputs (Optional to allow partial saves when models fail)
    transcription: Optional[str] = None
    final_score: Optional[float] = None
    confidence_class: Optional[int] = None
    confidence_label: Optional[str] = None
    confidence_probability: Optional[float] = None
    relevance: Optional[float] = None
    sentiment: Optional[float] = None
    emotion_probs: Optional[dict[str, float]] = None
    audio_features: Optional[AudioFeaturesModel] = None
    weights_loaded: bool = True
    developer_payload: dict[str, ModelMetadata] = Field(default_factory=dict)

    # Generated on the server before storing
    feedback: FeedbackModel
    explanations: Optional[ExplanationsModel] = None


# ── Response Models ───────────────────────────────────────────────────────────

class SessionPublic(BaseModel):
    """
    Safe session representation returned to the client.
    Includes computed id (string form of ObjectId).
    """
    id: str
    user_id: str
    timestamp: datetime
    question: str
    video: VideoMetadata

    # Pipeline outputs
    transcription: Optional[str] = None
    final_score: Optional[float] = None
    confidence_class: Optional[int] = None
    confidence_label: Optional[str] = None
    confidence_probability: Optional[float] = None
    relevance: Optional[float] = None
    sentiment: Optional[float] = None
    emotion_probs: Optional[dict[str, float]] = None
    audio_features: Optional[AudioFeaturesModel] = None
    weights_loaded: bool
    developer_payload: dict[str, ModelMetadata]

    # Server-generated feedback
    feedback: FeedbackModel
    explanations: Optional[ExplanationsModel] = None


class SessionSummary(BaseModel):
    """
    Lightweight representation used in list endpoints — omits heavy fields
    like audio_features.mfcc_mean for bandwidth.
    """
    id: str
    timestamp: datetime
    question: str
    video_filename: str
    final_score: Optional[float] = None
    confidence_label: Optional[str] = None
    confidence_probability: Optional[float] = None
    relevance: Optional[float] = None
    sentiment: Optional[float] = None
    emotion_probs: Optional[dict[str, float]] = None
    transcription: Optional[str] = None
    speech_rate: Optional[float] = None
    developer_payload: dict[str, ModelMetadata] = Field(default_factory=dict)

