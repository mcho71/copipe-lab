#!/bin/bash
# 1-3. PDF生成の強化（CJK対応）デモ
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORG="${1:-spring26-apex}"

echo "=== 1-3. PDF生成の強化（CJK対応） ==="
echo "org: $ORG"
sf apex run -f "$SCRIPT_DIR/demo_blob_topdf.apex" -o "$ORG"
echo ""
echo ">>> ファイルタブで CJK_PDF_Demo_Spring26.pdf を確認してください"
