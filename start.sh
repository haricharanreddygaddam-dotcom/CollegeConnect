#!/bin/bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
BACKEND="$DIR/backend"
FRONTEND="$DIR/frontend"
PYTHON_BIN="$BACKEND/venv/bin/python"

printf '%s\n' "=========================================================="
printf '%s\n' "🎓 Starting CampusConnect — Complete College Portal"
printf '%s\n' "=========================================================="

# Create a portable local Python environment when the project is cloned fresh.
if [ ! -x "$PYTHON_BIN" ]; then
  echo "🐍 Creating Python virtual environment..."
  rm -rf "$BACKEND/venv"
  python3 -m venv "$BACKEND/venv"
fi

echo "📦 Checking backend dependencies..."
"$PYTHON_BIN" -m pip install -q -r "$BACKEND/requirements.txt"

echo "🗄️ Applying database migrations..."
cd "$DIR"
PYTHONPATH="$BACKEND" "$PYTHON_BIN" -m alembic -c "$DIR/alembic.ini" upgrade head

echo "⚡ Starting FastAPI Backend at http://127.0.0.1:8000 ..."
cd "$DIR"
PYTHONPATH="$BACKEND" "$PYTHON_BIN" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Dependencies are installed from package-lock.json on a fresh clone.
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd "$FRONTEND"
  npm ci
fi

echo "💻 Starting React Vite Frontend at http://localhost:5173 ..."
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "✨ CampusConnect is running!"
echo "➡️  Frontend: http://localhost:5173"
echo "➡️  Backend Docs: http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to terminate both servers."

wait
