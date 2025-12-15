#!/bin/bash
# Cryptonauts - Local Server Launcher (Mac/Linux)

echo ""
echo "========================================"
echo "    CRYPTONAUTS - Expedition Crawler"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "[ERROR] Python is not installed."
        echo ""
        echo "Please install Python from https://www.python.org/downloads/"
        exit 1
    fi
    PYTHON_CMD="python"
else
    PYTHON_CMD="python3"
fi

echo "[OK] Python found: $PYTHON_CMD"

# Set the port
PORT=8000

# Check if port is in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[INFO] Port $PORT is in use, trying 8080..."
    PORT=8080
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "[INFO] Port 8080 is in use, trying 8888..."
        PORT=8888
    fi
fi

echo "[OK] Using port $PORT"
echo ""

# Change to script directory
cd "$(dirname "$0")"

echo "[INFO] Starting local web server..."
echo ""
echo "----------------------------------------"
echo "  Game URL: http://localhost:$PORT/start_screen.html"
echo "----------------------------------------"
echo ""
echo "[INFO] Keep this terminal open while playing!"
echo "[INFO] Press Ctrl+C to stop the server when done."
echo ""

# Open browser (works on Mac and most Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "http://localhost:$PORT/start_screen.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "http://localhost:$PORT/start_screen.html" 2>/dev/null || \
    sensible-browser "http://localhost:$PORT/start_screen.html" 2>/dev/null || \
    echo "[INFO] Please open http://localhost:$PORT/start_screen.html in your browser"
fi

# Start the Python HTTP server
$PYTHON_CMD -m http.server $PORT

echo ""
echo "[INFO] Server stopped. Thanks for playing Cryptonauts!"
