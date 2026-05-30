# 🧠 EmoChat — Emotion-Aware AI Chatbot

A real-time emotion-aware chatbot that detects your facial emotion via webcam, tracks emotional trends, and responds with an AI (Google Gemma via HuggingFace) that adapts its tone based on how you feel.

---

## 📁 Project Structure

```
emotion-chatbot/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example               # Copy to .env and add your API key
│   ├── routes/
│   │   ├── emotion.py             # POST /api/predict-emotion, /api/emotion-trend
│   │   └── chat.py                # POST /api/chat
│   └── services/
│       ├── emotion_service.py     # Simulated emotion (swap for ML here)
│       └── chatbot_service.py     # HuggingFace Gemma integration
└── frontend/
    ├── public/index.html
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                # Root layout + state wiring
        ├── api.js                 # API client functions
        ├── index.js / index.css
        ├── hooks/
        │   ├── useEmotion.js      # Emotion polling logic
        │   └── useChat.js         # Chat message state
        └── components/
            ├── Webcam.jsx         # Live webcam feed
            ├── EmotionPanel.jsx   # Emotion display + history
            ├── Chat.jsx           # Chat UI (input + messages)
            ├── MessageBubble.jsx  # Individual message
            ├── TypingIndicator.jsx
            └── FloatingEmoji.jsx  # Fixed top-right emoji overlay
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [HuggingFace account](https://huggingface.co) with an API key (free tier works)

---

### Step 1 — Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure API key
cp .env.example .env
# Edit .env and set: HF_API_KEY=your_huggingface_api_key_here

# Start the server
python -m uvicorn main:app --reload --port 8000
```

If you see `ModuleNotFoundError: No module named ...` (e.g. `dotenv`), it almost always means you’re starting the backend with a different Python than the one you installed deps into. Make sure the backend venv is activated and prefer `python -m pip ...` / `python -m uvicorn ...` so you always use the active environment.

Backend will be live at: **http://localhost:8000**
API docs: **http://localhost:8000/docs**

---

### Step 2 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will open at: **http://localhost:3000**

---

## 🎯 Features

| Feature | Status |
|---|---|
| Live webcam display | ✅ |
| Floating emotion emoji (😊😢😐😠) | ✅ |
| Emotion polling every 5s | ✅ |
| Last-5 emotion trend tracking | ✅ |
| Emotion-aware chat (Gemma AI) | ✅ |
| Loading indicators | ✅ |
| Quick reply suggestions | ✅ |
| Responsive design | ✅ |
| ML-ready architecture | ✅ |

---

## 🔑 Getting Your HuggingFace API Key

1. Go to https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Create a **fine-grained** token that has permission to **Make calls to Inference Providers**
4. Copy the token
5. Paste it in `backend/.env` as `HF_API_KEY=hf_...`

Note: This project uses Hugging Face’s OpenAI-compatible endpoint (`https://router.huggingface.co/v1/chat/completions`).

---

## 🔬 Future ML Integration

The emotion detection is currently simulated. To plug in a real model:

1. Open `backend/services/emotion_service.py`
2. Find the `# --- SIMULATION LAYER ---` block
3. Replace it with your TensorFlow/PyTorch inference code:

```python
import tensorflow as tf
import cv2, numpy as np

model = tf.keras.models.load_model("emotion_model.h5")
LABELS = ["angry", "happy", "neutral", "sad"]

def predict_emotion(frame_data: str = None):
    img = preprocess_frame(frame_data)  # decode base64, resize, normalize
    preds = model.predict(img)
    idx = np.argmax(preds)
    return LABELS[idx], float(preds[0][idx])
```

The API contract (`emotion` + `confidence`) remains identical — no frontend changes needed.

---

## 🧪 Enable Real ML Emotion Detection (Using emotion4.h5)

This repo includes an optional TensorFlow-based emotion detector in the backend.

1) Install optional ML dependencies into the backend venv:

```bash
cd backend
venv\Scripts\activate
python -m pip install -r requirements-ml.txt
```

2) Point the backend at your `.h5` model (optional):

- Default path used automatically if it exists:
    `emotion-chatbot/AI_companion_final/emotion4.h5`
- Or set an explicit path in `backend/.env`:

```env
EMOTION_MODEL_PATH=..\AI_companion_final\emotion4.h5
```

3) Start the backend and frontend.

When the camera is active, the frontend sends base64 frames to `POST /api/predict-emotion` and the UI updates with the model’s predicted mood.

---

## 🌐 API Endpoints

### `POST /api/predict-emotion`
```json
Request:  { "frame_data": null }
Response: { "emotion": "happy", "confidence": 0.85, "emoji": "😊" }
```

### `POST /api/emotion-trend`
```json
Request:  { "emotions": ["happy", "happy", "neutral", "sad", "happy"] }
Response: { "trend": "happy" }
```

### `POST /api/chat`
```json
Request:  { "message": "Hello!", "emotion": "happy", "trend": "happy", "history": [] }
Response: { "reply": "Hey there! ...", "emotion_used": "happy", "trend_used": "happy" }
```

---

## 🛠 Tech Stack

- **Frontend**: React 18, Tailwind CSS, custom hooks
- **Backend**: Python FastAPI, async/await
- **AI Model**: Google Gemma (via HuggingFace Inference API)
- **Design**: Dark theme, emotion-responsive color system
