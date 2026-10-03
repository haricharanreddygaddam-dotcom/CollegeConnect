#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "=========================================================="
echo "🎓 Starting CampusConnect — Complete College Portal"
echo "=========================================================="

# Start backend in background
echo "⚡ Starting FastAPI Backend at http://127.0.0.1:8000 ..."
cd "$DIR/backend"
PYTHONPATH=. "$DIR/backend/venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
echo "💻 Starting React Vite Frontend at http://localhost:5173 ..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT

echo ""
echo "✨ CampusConnect is running!"
echo "➡️  Frontend: http://localhost:5173"
echo "➡️  Backend Docs: http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to terminate both servers."

wait
