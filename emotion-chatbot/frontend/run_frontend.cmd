@echo off
setlocal

pushd "%~dp0"

npm install
npm start

popd
endlocal
