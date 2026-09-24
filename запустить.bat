@echo off
cd /d "%~dp0"
chcp 65001 > nul
echo ===================================================
echo   Запуск тренажёра «вкат.py»
echo ===================================================

:: 1. Проверяем стандартный путь установки Python
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    echo Запуск через Python 3.12 на порту 8085...
    start http://localhost:8085
    "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" -m http.server 8085
    exit /b
)

:: 2. Проверяем launcher py
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Запуск через py launcher на порту 8085...
    start http://localhost:8085
    py -m http.server 8085
    exit /b
)

:: 3. Проверяем команду python в PATH
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Запуск через python в PATH на порту 8085...
    start http://localhost:8085
    python -m http.server 8085
    exit /b
)

:: 4. Если Python не найден — открываем index.html напрямую (полностью автономно)
echo Открытие index.html напрямую в браузере...
start index.html
