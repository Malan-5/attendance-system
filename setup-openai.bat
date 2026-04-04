@echo off
REM Setup script for OpenAI Integration
REM This script helps set up the OpenAI API key for the Smart Classroom system

echo.
echo ========================================
echo  Smart Classroom - OpenAI Setup
echo ========================================
echo.

REM Check if API key is provided
if "%1"=="" (
    echo Usage: setup-openai.bat "sk-proj-your-api-key-here"
    echo.
    echo Instructions:
    echo 1. Get your API key from: https://platform.openai.com/account/api-keys
    echo 2. Run this command with your key as an argument
    echo.
    echo Example:
    echo   setup-openai.bat "sk-proj-DyxPlunIoaigIgQr4tvz5G65AqCiZe8lfu8ErWmKVvYaw"
    echo.
    pause
    exit /b 1
)

setlocal enabledelayedexpansion

set API_KEY=%1

echo Setting environment variable OPENAI_API_KEY...
setx OPENAI_API_KEY "%API_KEY%"

if %errorlevel% equ 0 (
    echo.
    echo ✓ Environment variable set successfully!
    echo.
    echo Next steps:
    echo 1. Restart your terminal/IDE for changes to take effect
    echo 2. Run: mvn clean compile
    echo 3. Run: .\mvnw.cmd spring-boot:run
    echo.
    echo Test the setup:
    echo   curl http://localhost:8080/api/ai/status
    echo.
) else (
    echo.
    echo ✗ Failed to set environment variable
    echo Please run as Administrator
    echo.
)

pause
