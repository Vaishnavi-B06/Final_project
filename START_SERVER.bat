@echo off
title SmartGlam AI Server
echo.
echo  ✦ SmartGlam — Installing dependencies...
echo.
pip install flask flask-cors google-genai Pillow
echo.
echo  ✦ Starting server on http://127.0.0.1:5000
echo  ✦ Keep this window open while using SmartGlam
echo  ✦ Press Ctrl+C to stop the server
echo.
python app.py
pause
