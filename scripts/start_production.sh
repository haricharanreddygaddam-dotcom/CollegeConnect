#!/bin/bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
BACKEND="$DIR/backend"
PYTHON_BIN="$BACKEND/venv/bin/python"

if [ ! -x "$PYTHON_BIN" ]; then
  echo "ERROR: backend virtual environment not found."
  echo "Create it with: python3 -m venv backend/venv"
  exit 1
fi

cd "$DIR"

echo "=========================================================="
echo "CampusConnect — Production API"
echo "=========================================================="

echo "📦 Checking backend dependencies..."
"$PYTHON_BIN" -m pip install -q -r "$BACKEND/requirements.txt"

echo "🔐 Validating production configuration..."
PYTHONPATH="$BACKEND" "$PYTHON_BIN" - <<'PY'
from app.core.config import settings

if settings.ENVIRONMENT != "production":
    raise SystemExit(
        "ERROR: ENVIRONMENT must be set to 'production' before using "
        "start_production.sh"
    )

print("Production configuration validated.")
PY

echo "🗄️ Applying database migrations..."
PYTHONPATH="$BACKEND" "$PYTHON_BIN" -m alembic \
  -c "$DIR/alembic.ini" upgrade head

echo "🚀 Starting CampusConnect API..."
echo "Host:    ${HOST:-127.0.0.1}"
echo "Port:    ${PORT:-8000}"
echo "Workers: ${WORKERS:-1}"

cd "$BACKEND"

exec "$PYTHON_BIN" -m uvicorn app.main:app \
  --host "${HOST:-127.0.0.1}" \
  --port "${PORT:-8000}" \
  --workers "${WORKERS:-1}" \
  --proxy-headers
