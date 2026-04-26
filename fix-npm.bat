@echo off
setlocal enabledelayedexpansion

echo === Step 1: Check Node and npm versions ===
node --version
npm --version

echo.
echo === Step 2: Remove node_modules ===
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
    echo Removed successfully
) else (
    echo node_modules not found
)

echo.
echo === Step 3: Attempt npm ci ===
npm ci
if !errorlevel! neq 0 (
    echo npm ci failed, trying npm install...
    npm install
) else (
    echo npm ci succeeded
)

echo.
echo === Step 4: Verify isexe has index.js ===
if exist "node_modules\isexe\index.js" (
    echo SUCCESS: isexe\index.js exists
    dir node_modules\isexe\index.js
) else (
    echo ERROR: isexe\index.js still missing
    echo Contents of node_modules\isexe:
    dir node_modules\isexe
)

echo.
echo === Step 5: Test npm start (5 second timeout) ===
timeout /t 2 /nobreak
echo Starting npm start...
start /wait cmd /c "timeout /t 5 /nobreak & npm start" > startup.log 2>&1
echo npm start output:
type startup.log
del startup.log

echo.
echo === Done ===
pause
