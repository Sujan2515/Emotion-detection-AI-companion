from dotenv import load_dotenv
import os

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.emotion import router as emotion_router
from routes.chat import router as chat_router

app = FastAPI(title="Emotion-Aware Chatbot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emotion_router, prefix="/api")
app.include_router(chat_router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "Emotion-Aware Chatbot API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
