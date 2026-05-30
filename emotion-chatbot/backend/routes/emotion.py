from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.emotion_service import predict_emotion, get_emotion_trend

router = APIRouter()


class EmotionRequest(BaseModel):
    frame_data: Optional[str] = None  # Base64 image — used in future ML version


class EmotionResponse(BaseModel):
    emotion: str
    confidence: float
    emoji: str


class TrendRequest(BaseModel):
    emotions: list[str]


class TrendResponse(BaseModel):
    trend: str


EMOTION_EMOJI_MAP = {
    "happy": "😊",
    "sad": "😢",
    "neutral": "😐",
    "angry": "😠",
}


@router.post("/predict-emotion", response_model=EmotionResponse)
async def predict_emotion_endpoint(request: EmotionRequest = None):
    """
    Predict current emotion from webcam frame.
    Uses the TensorFlow model when available; returns neutral when no face is detected.
    """
    frame_data = request.frame_data if request else None
    emotion, confidence = predict_emotion(frame_data)
    emoji = EMOTION_EMOJI_MAP.get(emotion, "😐")

    return EmotionResponse(emotion=emotion, confidence=confidence, emoji=emoji)


@router.post("/emotion-trend", response_model=TrendResponse)
async def emotion_trend_endpoint(request: TrendRequest):
    """
    Compute dominant emotion from recent history list.
    """
    trend = get_emotion_trend(request.emotions)
    return TrendResponse(trend=trend)
