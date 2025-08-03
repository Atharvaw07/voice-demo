@echo off
echo 🚀 Voice Demo Setup Script for Windows
echo ======================================
echo.

echo 📝 Creating .env file from template...
if not exist .env (
    copy env.example .env
    echo ✅ .env file created successfully!
    echo ⚠️  Remember to add your AssemblyAI API key to the .env file
) else (
    echo ✅ .env file already exists
)

echo.
echo 📦 Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo 📦 Installing client dependencies...
cd client
call npm install
cd ..
if %errorlevel% neq 0 (
    echo ❌ Failed to install client dependencies
    pause
    exit /b 1
)

echo.
echo ✅ All dependencies installed successfully!
echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Add your AssemblyAI API key to the .env file
echo 2. Run "npm run dev" to start the application
echo 3. Open http://localhost:3000 in your browser
echo.
echo For more help, see SETUP.md
echo.
pause 