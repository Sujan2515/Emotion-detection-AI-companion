#!/bin/bash
# EmoChat — Start both backend and frontend

set -e

echo ""
echo "🧠 EmoChat — Emotion-Aware AI Chatbot"
echo "======================================"
echo ""

# Check for .env
if [ ! -f "backend/.env" ]; then
  echo "⚠️  No .env file found. Copying from .env.example..."
  cp backend/.env.example backend/.env
  echo "   → Please edit backend/.env and add your HF_API_KEY"
  echo ""
fi

# Start backend
echo "🐍 Starting FastAPI backend on port 8000..."
cd backend
python -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
pip install -r requirements.txt -q
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
echo "⚛️  Starting React frontend on port 3000..."
cd frontend
npm install --silent
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers started!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Trap to kill both on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
