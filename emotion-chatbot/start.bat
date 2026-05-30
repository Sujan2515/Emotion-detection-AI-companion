@echo off
setlocal

REM Always run relative to this script's directory.
pushd "%~dp0"
echo.
echo 🧠 EmoChat — Emotion-Aware AI Chatbot
echo ======================================
echo.

IF NOT EXIST "backend\.env" (
  echo Copying .env.example to .env...
  IF EXIST "backend\.env.example" (
    copy /Y "backend\.env.example" "backend\.env" >nul
  ) ELSE (
    echo WARNING: backend\.env.example not found.
  )
  echo Please edit backend\.env and add your HF_API_KEY
  echo.
)

echo Starting FastAPI backend on port 8000...
pushd "backend"
IF NOT EXIST "venv\Scripts\activate.bat" (
  python -m venv venv
)
call "venv\Scripts\activate.bat"
python -m pip install -r "requirements.txt" -q

set "ML_MARKER=.ml_deps_installed"
IF EXIST "requirements-ml.txt" (
  IF EXIST "..\AI_companion_final\emotion4.h5" (
    IF NOT EXIST "%ML_MARKER%" (
      python -c "import tensorflow, cv2, numpy, PIL" >nul 2>nul
      IF ERRORLEVEL 1 (
        echo Installing ML dependencies: TensorFlow/OpenCV/Pillow...
        python -m pip install -r "requirements-ml.txt"
        IF ERRORLEVEL 1 (
          echo WARNING: ML install failed. Common cause is a locked NumPy DLL.
          echo Close other python or uvicorn windows, then run start.bat again.
        ) ELSE (
          type nul > "%ML_MARKER%"
        )
      ) ELSE (
        type nul > "%ML_MARKER%"
      )
    )
  )
)
start "EmoChat Backend" cmd /k "run_backend.cmd"
popd

timeout /t 3 /nobreak >nul

echo Starting React frontend on port 3000...
pushd "frontend"
start "EmoChat Frontend" cmd /k "run_frontend.cmd"
popd

echo.
echo Both servers starting...
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
popd
endlocal
pause
