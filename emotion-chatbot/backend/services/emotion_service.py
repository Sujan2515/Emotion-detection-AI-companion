"""Emotion Detection Service.

Supports two modes:
1) ML mode (preferred): If TensorFlow is installed and a model file is available,
   predicts emotion from a base64-encoded webcam frame.
2) Simulation fallback: If ML deps/model are missing, returns a plausible random
   emotion so the UI stays functional.

Env vars:
  - EMOTION_MODEL_PATH: path to a .h5 model file (optional)
    - EMOTION_SIMULATION: set true to enable simulated/random results
        - EMOTION_FACE_REQUIRED: set false to allow ML inference without detecting a face
    - EMOTION_HEURISTICS: set false to disable heuristic adjustments (default: true)
"""

import base64
import io
import os
import logging
from pathlib import Path
from threading import Lock
from typing import Optional, TYPE_CHECKING

try:
    # Optional dependency (only needed for ML mode)
    from PIL import Image
except Exception:  # pragma: no cover
    Image = None

if TYPE_CHECKING:  # pragma: no cover
    from PIL.Image import Image as PILImageType

logger = logging.getLogger(__name__)

_model = None
_model_lock = Lock()
_predict_lock = Lock()

_face_cascade = None
_face_cascade_lock = Lock()

LABELS = ["angry", "happy", "neutral", "sad"]


def predict_emotion(frame_data: str = None) -> tuple[str, float]:
    """
    Predict emotion from webcam frame.

    Args:
        frame_data: Base64-encoded image frame (unused in simulation,
                    will be used in real ML integration).

    Returns:
        tuple: (emotion_label: str, confidence: float)
    """
    ml_result = _predict_emotion_ml(frame_data)
    if ml_result is not None:
        return ml_result

    # Fallback: avoid returning misleading random emotions.
    sim = os.getenv("EMOTION_SIMULATION", "false").strip().lower() in {"1", "true", "yes", "on"}
    if sim:
        import random

        emotion = random.choice(LABELS)
        confidence = round(random.uniform(0.65, 0.98), 2)
        return emotion, confidence

    # If frame is missing or inference is unavailable, be explicit.
    return "neutral", 0.0


def _predict_emotion_ml(frame_data: Optional[str]) -> Optional[tuple[str, float]]:
    """Try to predict emotion via TensorFlow model; return None if unavailable."""

    if not frame_data:
        return None

    # Lazy import to keep backend lightweight when ML isn't used.
    try:
        import numpy as np
        from tensorflow.keras.models import load_model  # type: ignore[import-not-found]
    except Exception:
        return None

    if Image is None:
        return None

    model = _get_or_load_model(load_model)
    if model is None:
        return None

    try:
        face48, stats = _preprocess_for_model(frame_data)
        if face48 is None:
            return None

        # Keras models can be finicky with concurrent predict calls.
        with _predict_lock:
            preds = model.predict(face48, verbose=0)[0]

        use_heuristics = os.getenv("EMOTION_HEURISTICS", "true").strip().lower() not in {
            "0",
            "false",
            "no",
            "off",
        }

        if use_heuristics:
            preds = _apply_heuristics(preds, stats)

        idx = int(np.argmax(preds))
        emotion = LABELS[idx] if 0 <= idx < len(LABELS) else "neutral"
        confidence = float(preds[idx]) if 0 <= idx < len(preds) else 0.0
        return emotion, round(confidence, 2)
    except Exception:
        # If decoding/inference fails, keep the app usable.
        return None


def _get_face_cascade():
    """Lazy-load OpenCV Haar cascade for face detection."""

    global _face_cascade
    if _face_cascade is not None:
        return _face_cascade

    with _face_cascade_lock:
        if _face_cascade is not None:
            return _face_cascade

        try:
            import cv2

            _face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            )
            return _face_cascade
        except Exception:
            return None


def _preprocess_face48(frame_data: str):
    """Back-compat wrapper returning only the tensor."""

    tensor, _stats = _preprocess_for_model(frame_data)
    return tensor


def _preprocess_for_model(frame_data: str):
    """Decode base64 image, detect the largest face, and return tensor + simple ROI stats."""

    try:
        import numpy as np
        import cv2
    except Exception:
        return None, None

    img = _decode_base64_image(frame_data)
    if img is None:
        return None, None

    # Ensure RGB then convert to numpy.
    img = img.convert("RGB")
    rgb = np.asarray(img)

    # OpenCV expects BGR.
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    face_cascade = _get_face_cascade()
    roi = None

    face_required = os.getenv("EMOTION_FACE_REQUIRED", "true").strip().lower() not in {
        "0",
        "false",
        "no",
        "off",
    }

    if face_cascade is not None:
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.10,
            minNeighbors=5,
            minSize=(60, 60),
        )

        if len(faces) > 0:
            # Choose the largest face (best proxy for the primary user).
            x, y, w, h = max(faces, key=lambda f: int(f[2]) * int(f[3]))
            roi = gray[y : y + h, x : x + w]
        elif face_required:
            return None, None
    else:
        # If OpenCV face detection is unavailable, default to "no inference"
        # unless explicitly allowed.
        if face_required:
            return None, None

    if roi is None:
        # Optional fallback: run on full frame when face isn't detected.
        roi = gray

    # Match training-time preprocessing used in AI_companion_final/app.py
    roi = cv2.equalizeHist(roi)
    face48 = cv2.resize(roi, (48, 48), interpolation=cv2.INTER_AREA)
    face48 = face48.astype("float32") / 255.0
    face48 = face48.reshape(1, 48, 48, 1)

    # Stats used by heuristic adjustments (ported from AI_companion_final/app.py)
    stats = None
    try:
        h = roi.shape[0]
        upper = roi[0 : int(h * 0.35), :]
        lower = roi[int(h * 0.65) : h, :]
        stats = {
            "upper_mean": float(np.mean(upper)) if upper.size else 0.0,
            "lower_mean": float(np.mean(lower)) if lower.size else 0.0,
        }
    except Exception:
        stats = None

    return face48, stats


def _apply_heuristics(preds, stats):
    """Adjust probabilities using simple luminance heuristics from app.py."""

    try:
        import numpy as np
    except Exception:
        return preds

    if preds is None:
        return preds

    p = np.array(preds, dtype="float32")
    if p.ndim != 1 or p.size < 4:
        return preds

    upper_mean = float(stats.get("upper_mean", 0.0)) if stats else 0.0
    lower_mean = float(stats.get("lower_mean", 0.0)) if stats else 0.0

    # indices: 0 angry, 1 happy, 2 neutral, 3 sad
    if lower_mean > 132:
        p[1] += 0.18
    if upper_mean < 98:
        p[0] += 0.16
    if lower_mean < 108 and upper_mean > 102:
        p[3] += 0.16

    if int(np.argmax(p)) == 2:
        if p[3] > p[2] - 0.07:
            p[3] += 0.10
        if p[0] > p[2] - 0.07:
            p[0] += 0.10

    s = float(np.sum(p))
    if s > 0:
        p = p / s

    return p


def _get_or_load_model(load_model):
    global _model

    if _model is not None:
        return _model

    with _model_lock:
        if _model is not None:
            return _model

        model_path = _resolve_model_path()
        if model_path is None:
            return None

        _model = load_model(str(model_path))
        return _model


def _resolve_model_path() -> Optional[Path]:
    # User override first
    env_path = os.getenv("EMOTION_MODEL_PATH", "").strip()
    if env_path:
        p = Path(env_path)
        return p if p.exists() else None

    # Default: emotion-chatbot/AI_companion_final/emotion4.h5
    project_root = Path(__file__).resolve().parents[2]
    default_path = project_root / "AI_companion_final" / "emotion4.h5"
    return default_path if default_path.exists() else None


def _decode_base64_image(frame_data: str) -> Optional["PILImageType"]:
    """Decode a base64 image string (supports data URLs)."""

    b64 = frame_data
    if "," in b64 and b64.strip().lower().startswith("data:"):
        b64 = b64.split(",", 1)[1]

    if Image is None:
        return None

    raw = base64.b64decode(b64)
    return Image.open(io.BytesIO(raw))


def get_emotion_trend(emotions: list[str]) -> str:
    """
    Compute dominant emotion from recent history.

    Args:
        emotions: List of recent emotion labels (last N detections).

    Returns:
        str: The most frequently occurring emotion.
    """
    if not emotions:
        return "neutral"
    return max(set(emotions), key=emotions.count)
