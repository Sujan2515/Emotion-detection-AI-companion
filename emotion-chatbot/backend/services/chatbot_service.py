"""
Chatbot Service
---------------
Integrates with HuggingFace Inference API using google/gemma-3-27b-it.
Emotion-aware system prompt tailors responses to user's detected state.
"""

import httpx
import os
from pathlib import Path
from typing import Optional

# Hugging Face Inference Providers (OpenAI-compatible) endpoint.
# Docs: https://huggingface.co/docs/inference-providers/index
HF_BASE_URL = os.getenv("HF_BASE_URL", "https://router.huggingface.co/v1").rstrip("/")
HF_API_URL = f"{HF_BASE_URL}/chat/completions"
HF_MODEL = os.getenv("HF_MODEL", "google/gemma-3-27b-it")


def _get_httpx_verify():
    """Return the httpx 'verify' setting.

    Corporate proxies often MITM TLS using an internal CA, which causes:
      [SSL: CERTIFICATE_VERIFY_FAILED] self signed certificate in certificate chain

    Prefer providing a CA bundle path (HF_CA_BUNDLE). As a last resort for local
    dev only, you can disable verification via HF_SSL_VERIFY=false.
    """

    ca_bundle = os.getenv("HF_CA_BUNDLE", "").strip()
    if ca_bundle:
        p = Path(ca_bundle)
        return str(p) if p.exists() else str(p)

    ssl_verify = os.getenv("HF_SSL_VERIFY", "true").strip().lower()
    if ssl_verify in {"0", "false", "no", "off"}:
        return False

    return True

EMOTION_INSTRUCTIONS = {
    "sad": (
        "The user seems to be feeling sad or down. "
        "Be warm, supportive, and calm. "
        "Acknowledge their feelings gently. Use soft, comforting language. "
        "Offer encouragement without being dismissive."
    ),
    "happy": (
        "The user is in a great mood! "
        "Match their energy — be upbeat, friendly, and enthusiastic. "
        "Keep the vibe light and fun while still being helpful."
    ),
    "angry": (
        "The user appears frustrated or irritated. "
        "Stay composed, patient, and de-escalating. "
        "Avoid anything that could seem dismissive or confrontational. "
        "Focus on solutions and speak calmly."
    ),
    "neutral": (
        "The user is in a neutral state. "
        "Be professional, clear, and helpful as usual."
    ),
}


def build_system_prompt(emotion: str, trend: str) -> str:
    emotion_lower = emotion.lower()
    trend_lower = trend.lower()

    current_instruction = EMOTION_INSTRUCTIONS.get(
        emotion_lower, EMOTION_INSTRUCTIONS["neutral"]
    )
    trend_instruction = EMOTION_INSTRUCTIONS.get(
        trend_lower, EMOTION_INSTRUCTIONS["neutral"]
    )

    return f"""You are an emotionally intelligent assistant. 

Current emotional context:
- Right now: {current_instruction}
- Recent trend: The user has generally been feeling {trend_lower}. {trend_instruction}

IMPORTANT RULES:
- Do NOT explicitly mention that you are detecting emotions or analyzing their mood.
- Do NOT say things like "I can tell you're feeling..." or "Based on your emotion..."
- Simply let your tone and approach naturally reflect the emotional context.
- Keep responses concise (2-4 sentences for casual chat, longer for complex questions).
- Be genuinely helpful and human-like in your responses."""


async def get_chat_response(
    message: str,
    emotion: str,
    trend: str,
    conversation_history: Optional[list] = None,
) -> str:
    """
    Get a response from the Gemma model via HuggingFace Inference API.

    Args:
        message: The user's current message.
        emotion: Detected current emotion label.
        trend: Dominant emotion from recent history.
        conversation_history: Previous messages for context.

    Returns:
        str: Assistant's response text.
    """
    hf_api_key = os.getenv("HF_API_KEY", "")
    if not hf_api_key:
        return (
            "⚠️ HuggingFace API key not configured. "
            "Please set the HF_API_KEY environment variable and restart the server."
        )

    system_prompt = build_system_prompt(emotion, trend)

    messages = [{"role": "system", "content": system_prompt}]

    if conversation_history:
        messages.extend(conversation_history[-6:])  # Keep last 3 exchanges

    messages.append({"role": "user", "content": message})

    payload = {
        "model": HF_MODEL,
        "messages": messages,
        "max_tokens": 512,
        "temperature": 0.75,
        "top_p": 0.9,
        "stream": False,
    }

    headers = {
        "Authorization": f"Bearer {hf_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0, verify=_get_httpx_verify()) as client:
        response = await client.post(HF_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    reply = data["choices"][0]["message"]["content"].strip()
    return reply
