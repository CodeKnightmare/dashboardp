@echo off
title Dashboard Analitico: IA en la Educacion
echo ===================================================================
echo Iniciando Servidor Local para el Dashboard Analitico...
echo URL: http://localhost:8000/index.html
echo ===================================================================
start "" "http://localhost:8000/index.html"
python -m http.server 8000
pause
