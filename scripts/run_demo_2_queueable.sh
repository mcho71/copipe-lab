#!/bin/bash
# 2. Apex Cursor × Queueable チェーンデモ
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORG="${1:-spring26-apex}"

echo "=== 2. Apex Cursor × Queueable チェーン ==="
echo "org: $ORG"
sf apex run -f "$SCRIPT_DIR/demo_cursor_queueable.apex" -o "$ORG"
echo ""
echo ">>> ジョブ結果確認:"
echo "sf data query -o $ORG -q \"SELECT Status, CreatedDate FROM AsyncApexJob WHERE JobType='Queueable' ORDER BY CreatedDate DESC LIMIT 5\""
