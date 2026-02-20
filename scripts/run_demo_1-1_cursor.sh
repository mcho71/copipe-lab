#!/bin/bash
# 1-1. SOQL OFFSET上限 vs Apex Cursor デモ
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORG="${1:-spring26-apex}"

echo "=== 1-1. SOQL OFFSET上限 vs Apex Cursor ==="
echo "org: $ORG"
sf apex run -f "$SCRIPT_DIR/demo_offset_vs_cursor.apex" -o "$ORG"
