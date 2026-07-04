import os
import tempfile
import shutil
import time
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any
import uuid

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import json

from utils.logger import get_structured_logger, request_id_var

# Configure structured logging
logger = get_structured_logger("api")

# Auth module
from auth.router import router as auth_router
from auth.dependencies import get_current_user
from auth.models import UserPublic
from auth.config import MONGODB_URI

# Sessions module
from sessions.router import router as sessions_router
from sessions.service import session_service
from sessions.feedback import generate_feedback, generate_explanations
from sessions.models import SessionCreate, AudioFeaturesModel, VideoMetadata, FeedbackModel

# Coaching module
from coaching.router import router as coaching_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: verify MongoDB Atlas connectivity and model configurations."""
    # 1. Validate Configurations
    required_weights = [CONFIDENCE_WEIGHTS, SCORING_WEIGHTS, EMOTION_WEIGHTS]
    missing = [w for w in required_weights if not os.path.exists(w)]
    if missing:
        logger.error("Configuration Validation Failed: Missing PyTorch weights", extra={"extra_data": {"missing_files": missing}})
        raise RuntimeError(f"Startup aborted. Missing model weights: {missing}")

    # 2. Verify MongoDB
    if MONGODB_URI:
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=8000)
            info = await client.server_info()
            client.close()
            logger.info(f"MongoDB Atlas connected - server v{info.get('version')}")
        except Exception as e:
            logger.critical(f"MongoDB Atlas connection FAILED: {e}")
            raise RuntimeError(f"Startup aborted. Database unreachable: {e}")
    else:
        logger.warning("MONGODB_URI not set - auth endpoints will not work.")
        
    yield  # Application runs here


app = FastAPI(title="Interview Insight API", lifespan=lifespan)



# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_tracing_middleware(request: Request, call_next):
    """Injects a unique Request ID for traceability and logs execution time."""
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    token = request_id_var.set(req_id)
    
    start_time = time.time()
    logger.info(f"Incoming Request: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        response.headers["X-Request-ID"] = req_id
        logger.info(f"Request Completed: {request.method} {request.url.path}", extra={"extra_data": {"status_code": response.status_code, "duration_ms": round(process_time, 2)}})
        return response
    except Exception:
        process_time = (time.time() - start_time) * 1000
        logger.error(f"Request Failed: {request.method} {request.url.path}", exc_info=True, extra={"extra_data": {"duration_ms": round(process_time, 2)}})
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error", "request_id": req_id})
    finally:
        request_id_var.reset(token)

# Include authentication routes
app.include_router(auth_router)

# Include session history routes
app.include_router(sessions_router)

# Include coaching suggestions routes
app.include_router(coaching_router)

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
    return {"status": "ok", "device": str(get_device()), "timestamp": time.time()}

@app.get("/api/health/models")
async def health_models_check():
    """Developer Diagnostic Endpoint for tracing loaded PyTorch singletons."""
    return {
        "device": str(get_device()),
        "nlp_processor": {"status": "Warm" if _nlp_processor else "Cold", "weights_loaded": _nlp_processor is not None},
        "vision_processor": {"status": "Warm" if _vision_processor else "Cold", "weights_loaded": getattr(_vision_processor, "weights_loaded", False) if _vision_processor else False},
        "confidence_predictor": {"status": "Warm" if _confidence_predictor else "Cold", "weights_loaded": getattr(_confidence_predictor, "weights_loaded", False) if _confidence_predictor else False},
        "fusion_scorer": {"status": "Warm" if _fusion_scorer else "Cold", "weights_loaded": getattr(_fusion_scorer, "weights_loaded", False) if _fusion_scorer else False},
    }

@app.get("/api/health/database")
async def health_database_check():
    """Developer Diagnostic Endpoint for MongoDB latency."""
    if not MONGODB_URI:
        return {"status": "Unavailable", "reason": "MONGODB_URI not set"}
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        t0 = time.time()
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        await client.server_info()
        client.close()
        latency_ms = (time.time() - t0) * 1000
        return {"status": "Healthy", "latency_ms": round(latency_ms, 2)}
    except Exception as e:
        return {"status": "Degraded", "error": str(e)}



async def process_video_generator(temp_dir: str, temp_video_path: str, filename: str, size: int, content_type: str, question: str, current_user_id: str):
    import traceback
    try:
        developer_payload = {}
        transcription, audio_features = None, None
        
        yield f"data: {json.dumps({'stage': 'speech'})}\n\n"
        await asyncio.sleep(0.1)
        
        try:
            from pipeline.speech import process_audio
            logger.debug(f"[Speech] Processing audio for {filename}")
            t0 = time.time()
            transcription, audio_features = process_audio(temp_video_path, model_size="tiny")
            t1 = time.time()
            logger.debug(f"[Speech] Extraction complete. Transcription length: {len(transcription) if transcription else 0}")
            developer_payload["speech"] = {
                "model_name": "whisper",
                "version": "tiny",
                "inference_time_ms": (t1 - t0) * 1000,
                "weights_loaded": True,
                "device": str(get_device()),
                "feature_vector_size": len(audio_features['mfcc_mean']) if audio_features else None,
                "execution_status": "Success",
                "confidence_score": None,
                "reason": None
            }
        except Exception as e:
            logger.debug(f"[Speech] Failed: {e}")
            developer_payload["speech"] = {
                "model_name": "whisper", "version": "tiny", "inference_time_ms": 0.0,
                "weights_loaded": False, "device": str(get_device()), "feature_vector_size": None,
                "execution_status": "Failed", "confidence_score": None, "reason": str(e)
            }

        yield f"data: {json.dumps({'stage': 'nlp'})}\n\n"
        await asyncio.sleep(0.1)
        relevance, sentiment = None, None
        if developer_payload["speech"]["execution_status"] == "Success":
            try:
                logger.debug(f"[NLP] Analyzing text for question: '{question}'")
                t0 = time.time()
                relevance, sentiment = get_nlp_processor().process_text(transcription, question)
                t1 = time.time()
                logger.debug(f"[NLP] Complete. Relevance: {relevance:.2f}, Sentiment: {sentiment:.2f}")
                developer_payload["nlp"] = {
                    "model_name": "multi-qa-MiniLM-L6-cos-v1 / distilbert-sst2",
                    "version": "v1",
                    "inference_time_ms": (t1 - t0) * 1000,
                    "weights_loaded": True,
                    "device": str(get_device()),
                    "feature_vector_size": 2,
                    "execution_status": "Success",
                    "confidence_score": None,
                    "reason": None
                }
            except Exception as e:
                logger.debug(f"[NLP] Failed: {e}")
                developer_payload["nlp"] = {
                    "model_name": "multi-qa-MiniLM-L6-cos-v1", "version": "v1", "inference_time_ms": 0.0,
                    "weights_loaded": False, "device": str(get_device()), "feature_vector_size": None,
                    "execution_status": "Failed", "confidence_score": None, "reason": str(e)
                }
        else:
            developer_payload["nlp"] = {
                "model_name": "multi-qa-MiniLM-L6-cos-v1", "version": "v1", "inference_time_ms": 0.0,
                "weights_loaded": False, "device": str(get_device()), "feature_vector_size": None,
                "execution_status": "Bypassed", "confidence_score": None, "reason": "Depends on failed Speech model"
            }

        yield f"data: {json.dumps({'stage': 'vision'})}\n\n"
        await asyncio.sleep(0.1)
        emotion_probs = None
        try:
            logger.debug(f"[Vision] Analyzing facial expressions for {filename}")
            t0 = time.time()
            emotion_probs = get_vision_processor().process_video(temp_video_path)
            t1 = time.time()
            logger.debug(f"[Vision] Complete. Emotion probs keys: {list(emotion_probs.keys()) if emotion_probs else None}")
            developer_payload["vision"] = {
                "model_name": "emotion_cnn",
                "version": "v1.0",
                "inference_time_ms": (t1 - t0) * 1000,
                "weights_loaded": True,
                "device": str(get_device()),
                "feature_vector_size": len(emotion_probs) if emotion_probs else None,
                "execution_status": "Success",
                "confidence_score": max(emotion_probs.values()) if emotion_probs else None,
                "reason": None
            }
        except Exception as e:
            logger.debug(f"[Vision] Failed: {e}")
            developer_payload["vision"] = {
                "model_name": "emotion_cnn", "version": "v1.0", "inference_time_ms": 0.0,
                "weights_loaded": False, "device": str(get_device()), "feature_vector_size": None,
                "execution_status": "Failed", "confidence_score": None, "reason": str(e)
            }

        yield f"data: {json.dumps({'stage': 'confidence'})}\n\n"
        await asyncio.sleep(0.1)
        confidence_class, confidence_label, confidence_probability = None, None, None
        if developer_payload["speech"]["execution_status"] == "Success" and developer_payload["vision"]["execution_status"] == "Success":
            try:
                logger.debug("[Confidence] Predicting acoustic confidence")
                t0 = time.time()
                confidence_class, confidence_label, confidence_probability = get_confidence_predictor().predict(audio_features, emotion_probs)
                t1 = time.time()
                logger.debug(f"[Confidence] Complete. Prob: {confidence_probability:.2f}")
                developer_payload["confidence"] = {
                    "model_name": "confidence_ann",
                    "version": "v1.0",
                    "inference_time_ms": (t1 - t0) * 1000,
                    "weights_loaded": True,
                    "device": str(get_device()),
                    "feature_vector_size": 25,
                    "execution_status": "Success",
                    "confidence_score": confidence_probability,
                    "reason": None
                }
            except Exception as e:
                logger.debug(f"[Confidence] Failed: {e}")
                developer_payload["confidence"] = {
                    "model_name": "confidence_ann", "version": "v1.0", "inference_time_ms": 0.0,
                    "weights_loaded": False, "device": str(get_device()), "feature_vector_size": None,
                    "execution_status": "Failed", "confidence_score": None, "reason": str(e)
                }
        else:
            developer_payload["confidence"] = {
                "model_name": "confidence_ann", "version": "v1.0", "inference_time_ms": 0.0,
                "weights_loaded": False, "device": str(get_device()), "feature_vector_size": None,
                "execution_status": "Bypassed", "confidence_score": None, "reason": "Depends on failed Speech/Vision models"
            }

        yield f"data: {json.dumps({'stage': 'score'})}\n\n"
        await asyncio.sleep(0.1)
        final_score = None
        if (developer_payload["nlp"]["execution_status"] == "Success" and 
            developer_payload["vision"]["execution_status"] == "Success" and 
            developer_payload["confidence"]["execution_status"] == "Success" and 
            developer_payload["speech"]["execution_status"] == "Success"):
            try:
                logger.debug("[Fusion] Calculating final score")
                t0 = time.time()
                final_score = get_fusion_scorer().predict(
                    relevance=relevance,
                    sentiment=sentiment,
                    emotion_probs=emotion_probs,
                    confidence_class=confidence_class,
                    mfcc_mean=audio_features['mfcc_mean']
                )
                t1 = time.time()
                logger.debug(f"[Fusion] Complete. Score: {final_score}")
                developer_payload["fusion"] = {
                    "model_name": "scoring_ann",
                    "version": "v1.0",
                    "inference_time_ms": (t1 - t0) * 1000,
                    "weights_loaded": True,
                    "device": str(get_device()),
                    "feature_vector_size": 20,
                    "execution_status": "Success",
                    "confidence_score": final_score,
                    "reason": None
                }
            except Exception as e:
                logger.debug(f"[Fusion] Failed: {e}")
                developer_payload["fusion"] = {
                    "model_name": "scoring_ann", "version": "v1.0", "inference_time_ms": 0.0,
                    "weights_loaded": False, "device": str(get_device()), "feature_vector_size": None,
                    "execution_status": "Failed", "confidence_score": None, "reason": str(e)
                }
        else:
            developer_payload["fusion"] = {
                "model_name": "scoring_ann", "version": "v1.0", "inference_time_ms": 0.0,
                "weights_loaded": False, "device": str(get_device()), "feature_vector_size": None,
                "execution_status": "Bypassed", "confidence_score": None, "reason": "Depends on failed sub-models"
            }

        result = {
            "transcription": transcription,
            "relevance": relevance,
            "sentiment": sentiment,
            "emotion_probs": emotion_probs,
            "confidence_class": confidence_class,
            "confidence_label": confidence_label,
            "confidence_probability": confidence_probability,
            "final_score": final_score,
            "audio_features": audio_features,
            "weights_loaded": True,
            "developer_payload": developer_payload,
        }

        yield f"data: {json.dumps({'stage': 'database'})}\n\n"
        await asyncio.sleep(0.1)
        
        # Persist session
        try:
            af = audio_features or {}
            if final_score is None:
                feedback = FeedbackModel(
                    strengths=["N/A - Analysis incomplete"],
                    weaknesses=["N/A - Analysis incomplete"],
                    suggestions=["Please review the model status to fix pipeline errors."]
                )
            else:
                feedback = generate_feedback(
                    final_score=final_score,
                    relevance=relevance,
                    sentiment=sentiment,
                    confidence_label=confidence_label,
                    emotion_probs=emotion_probs,
                    speech_rate=af.get("speech_rate"),
                )

            explanations = generate_explanations(
                final_score=final_score,
                relevance=relevance,
                sentiment=sentiment,
                confidence_label=confidence_label,
                emotion_probs=emotion_probs,
                speech_rate=af.get("speech_rate"),
            )

            session = await session_service.create(
                SessionCreate(
                    user_id=current_user_id,
                    question=question,
                    video=VideoMetadata(
                        filename=filename,
                        size_bytes=size,
                        content_type=content_type
                    ),
                    transcription=transcription,
                    relevance=relevance,
                    sentiment=sentiment,
                    emotion_probs=emotion_probs,
                    confidence_class=confidence_class,
                    confidence_label=confidence_label,
                    confidence_probability=confidence_probability,
                    final_score=final_score,
                    audio_features=AudioFeaturesModel(**af) if af else None,
                    weights_loaded=True,
                    developer_payload=developer_payload,
                    feedback=feedback,
                    explanations=explanations,
                )
            )
            result["session_id"] = str(session.id)
            print(f"[session] Saved session {session.id} for user {current_user_id}", flush=True)
        except Exception as session_err:
            print(f"[session] WARNING: Failed to save session: {session_err}", flush=True)
            result["session_id"] = None

        yield f"data: {json.dumps({'stage': 'Complete', 'result': result})}\n\n"

    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"CRITICAL ERROR in process_video_generator: {e}")
        print(error_trace)
        yield f"data: {json.dumps({'stage': 'Failed', 'error': str(e)})}\n\n"
    finally:
        if temp_dir:
            shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/api/analyze")
async def analyze_interview(
    video: UploadFile = File(...),
    question: str = Form(...),
    _current_user: UserPublic = Depends(get_current_user),
):
    if not video.filename.endswith(('.mp4', '.webm')):
        raise HTTPException(status_code=400, detail="Invalid video format. Must be .mp4 or .webm")

    temp_dir = tempfile.mkdtemp()
    temp_video_path = os.path.join(temp_dir, video.filename)
    with open(temp_video_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    return StreamingResponse(
        process_video_generator(
            temp_dir=temp_dir, 
            temp_video_path=temp_video_path, 
            filename=video.filename, 
            size=video.size, 
            content_type=video.content_type, 
            question=question, 
            current_user_id=_current_user.id
        ),
        media_type="text/event-stream"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000)
