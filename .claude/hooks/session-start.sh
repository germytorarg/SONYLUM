#!/bin/bash
# Installs the Remotion video workspace so every cloud session can render videos.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR/remotion"
npm install --no-audit --no-fund
