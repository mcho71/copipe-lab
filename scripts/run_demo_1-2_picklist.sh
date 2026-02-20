#!/bin/bash
# 1-2. レコードタイプ別選択リスト値取得デモ
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORG="${1:-spring26-apex}"

echo "=== 1-2. レコードタイプ別選択リスト値取得 ==="
echo "org: $ORG"
sf apex run -f "$SCRIPT_DIR/demo_picklist_by_recordtype.apex" -o "$ORG"
