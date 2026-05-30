from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.chatbot_service import get_chat_response

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    emotion: str = "neutral"
    trend: str = "neutral"
    history: Optional[list[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    emotion_used: str
    trend_used: str


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Get an emotion-aware chatbot response from Gemma via HuggingFace.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    history = (
        [{"role": m.role, "content": m.content} for m in request.history]
        if request.history
        else []
    )

    try:
        reply = await get_chat_response(
            message=request.message,
            emotion=request.emotion,
            trend=request.trend,
            conversation_history=history,
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Chatbot service error: {str(e)}",
        )

    return ChatResponse(
        reply=reply,
        emotion_used=request.emotion,
        trend_used=request.trend,
    )
