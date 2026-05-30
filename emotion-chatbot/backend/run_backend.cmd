@echo off
setlocal

pushd "%~dp0"

if not exist "venv\Scripts\activate.bat" (
  echo Backend venv not found. Run start.bat first.
  popd
  exit /b 1
)

call "venv\Scripts\activate.bat"
python -m uvicorn main:app --reload --port 8000

popd
endlocal
