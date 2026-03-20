#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

mkdir -p .dejavu

if [[ ! -d backend/.venv ]]; then
  python3 -m venv backend/.venv
fi
# shellcheck disable=SC1091
source backend/.venv/bin/activate
pip install -q -r backend/requirements.txt

if [[ ! -d frontend/node_modules ]]; then
  (cd frontend && npm install)
fi

trap 'kill $(jobs -p) 2>/dev/null || true' EXIT INT TERM

# tee：终端可见 + 写入 .dejavu（与 docker logs 行为对齐思路）
(cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 22001 2>&1 | tee -a "$ROOT/.dejavu/backend.log") &
sleep 0.5
(cd frontend && npm run dev -- --host 127.0.0.1 --port 22000 2>&1 | tee -a "$ROOT/.dejavu/frontend.log") &
wait
