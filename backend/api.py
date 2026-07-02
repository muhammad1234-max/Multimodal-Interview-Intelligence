import os
import tempfile
import shutil
from typing import Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Interview Insight API")



# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model paths
CONFIDENCE_WEIGHTS = "weights/confidence_ann.pt"
SCORING_WEIGHTS = "weights/scoring_ann.pt"
EMOTION_WEIGHTS = "weights/emotion_cnn.pt"

# Lazy-loaded singletons — initialized on first request to avoid
# Windows DLL conflicts between llvmlite (numba/whisper) and PyTorch
# threading when loading transformers models at import time.
_device = None
_nlp_processor = None
_vision_processor = None
_confidence_predictor = None
_fusion_scorer = None


def get_device():
    global _device
    if _device is None:
        import torch
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[startup] Using device: {_device}")
    return _device


def get_nlp_processor():
    global _nlp_processor
    if _nlp_processor is None:
        print("[startup] Loading NLP processor...")
        from pipeline.nlp import NLPProcessor
        _nlp_processor = NLPProcessor(device=get_device())
        print("[startup] NLP processor ready.")
    return _nlp_processor


def get_vision_processor():
    global _vision_processor
    if _vision_processor is None:
        print("[startup] Loading vision processor...")
        from pipeline.vision import VisionProcessor
        _vision_processor = VisionProcessor(weights_path=EMOTION_WEIGHTS, device=get_device())
        print("[startup] Vision processor ready.")
    return _vision_processor


def get_confidence_predictor():
    global _confidence_predictor
    if _confidence_predictor is None:
        print("[startup] Loading confidence predictor...")
        from pipeline.confidence import ConfidencePredictor
        _confidence_predictor = ConfidencePredictor(weights_path=CONFIDENCE_WEIGHTS, device=get_device())
        print("[startup] Confidence predictor ready.")
    return _confidence_predictor


def get_fusion_scorer():
    global _fusion_scorer
    if _fusion_scorer is None:
        print("[startup] Loading fusion scorer...")
        from pipeline.fusion import FusionScorer
        _fusion_scorer = FusionScorer(weights_path=SCORING_WEIGHTS, input_size=20, device=get_device())
        print("[startup] Fusion scorer ready.")
    return _fusion_scorer


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "device": str(get_device())}


@app.post("/api/analyze")
async def analyze_interview(
    video: UploadFile = File(...),
    question: str = Form(...)
) -> Dict[str, Any]:
    if not video.filename.endswith(('.mp4', '.webm')):
        raise HTTPException(status_code=400, detail="Invalid video format. Must be .mp4 or .webm")


    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp()
        temp_video_path = os.path.join(temp_dir, video.filename)


        with open(temp_video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        from pipeline.speech import process_audio
        print(f"Processing audio for {video.filename}...")
        transcription, audio_features = process_audio(temp_video_path, model_size="tiny")

        print(f"Analyzing text for question: '{question}'...")
        relevance, sentiment = get_nlp_processor().process_text(transcription, question)

        print(f"Analyzing facial expressions...")
        emotion_probs = get_vision_processor().process_video(temp_video_path)

        print(f"Predicting confidence...")
        confidence_class, confidence_label = get_confidence_predictor().predict(audio_features, emotion_probs)

        print(f"Calculating final score...")
        final_score = get_fusion_scorer().predict(
            relevance=relevance,
            sentiment=sentiment,
            emotion_probs=emotion_probs,
            confidence_class=confidence_class,
            mfcc_mean=audio_features['mfcc_mean']
        )

        return {
            "transcription": transcription,
            "relevance": relevance,
            "sentiment": sentiment,
            "emotion_probs": emotion_probs,
            "confidence_class": confidence_class,
            "confidence_label": confidence_label,
            "final_score": final_score,
            "audio_features": audio_features,
            "weights_loaded": True
        }

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"CRITICAL ERROR in /api/analyze: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_dir:
            shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000)
