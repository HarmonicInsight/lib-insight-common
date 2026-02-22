#!/usr/bin/env bash
# =============================================================================
# Build Doctor UI — ブラウザダッシュボード起動スクリプト
#
# 使い方:
#   ./scripts/build-doctor-ui.sh [project-directory] [--port 8787]
#
# 動作:
#   1) build_logs/ から JSON レポートを読み込む
#   2) Python HTTP サーバーを起動（API + 静的 HTML 配信）
#   3) ブラウザを自動で開く
#   4) Ctrl+C で終了
#
# 必要なもの: Python 3.x（OS 標準で入っている）
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${1:-.}"
PORT="${3:-8787}"

# --port オプション解析
shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# 絶対パスに変換
PROJECT_DIR=$(cd "$PROJECT_DIR" 2>/dev/null && pwd)
LOG_DIR="$PROJECT_DIR/build_logs"

if [[ ! -d "$LOG_DIR" ]]; then
  echo "[BUILD-DOCTOR-UI] build_logs/ が見つかりません: $LOG_DIR"
  echo "[BUILD-DOCTOR-UI] まず build-doctor.sh を実行してください"
  mkdir -p "$LOG_DIR"
fi

echo ""
echo "  ══════════════════════════════════════════════"
echo "  Build Doctor Dashboard"
echo "  ══════════════════════════════════════════════"
echo ""
echo "  Project:  $PROJECT_DIR"
echo "  Log dir:  $LOG_DIR"
echo "  URL:      http://localhost:${PORT}"
echo ""
echo "  Ctrl+C で終了"
echo ""

# ブラウザを非同期で開く
(
  sleep 1
  if command -v open &>/dev/null; then
    open "http://localhost:${PORT}"
  elif command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:${PORT}"
  elif command -v start &>/dev/null; then
    start "http://localhost:${PORT}"
  else
    echo "[BUILD-DOCTOR-UI] ブラウザを開いてください: http://localhost:${PORT}"
  fi
) &

# Python サーバー起動
python3 -c "
import http.server
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

LOG_DIR = '''${LOG_DIR}'''
HTML_PATH = '''${SCRIPT_DIR}/build-doctor-ui.html'''
PORT = int('''${PORT}''')

class BuildDoctorHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # 静的ファイルのログは抑制、APIのみ表示
        path = args[0].split()[1] if args else ''
        if '/api/' in str(path):
            super().log_message(fmt, *args)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/reports':
            self.send_reports()
        elif path == '/api/logs' and parsed.query:
            self.send_log_file(parsed.query)
        elif path == '/' or path == '/index.html':
            self.send_html()
        else:
            self.send_error(404)

    def send_reports(self):
        reports = []
        log_dir = Path(LOG_DIR)
        if log_dir.exists():
            for f in sorted(log_dir.glob('report_*.json'), reverse=True):
                try:
                    with open(f, 'r', encoding='utf-8') as fh:
                        data = json.load(fh)
                        data['_file'] = f.name
                        reports.append(data)
                except (json.JSONDecodeError, IOError):
                    pass

        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(reports, ensure_ascii=False).encode('utf-8'))

    def send_log_file(self, query):
        # query: file=xxx.log
        params = dict(p.split('=', 1) for p in query.split('&') if '=' in p)
        filename = params.get('file', '')
        if not filename or '..' in filename or '/' in filename:
            self.send_error(400)
            return
        filepath = Path(LOG_DIR) / filename
        if not filepath.exists():
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()
        with open(filepath, 'r', encoding='utf-8', errors='replace') as fh:
            # 最大1MB
            self.wfile.write(fh.read(1024 * 1024).encode('utf-8'))

    def send_html(self):
        try:
            with open(HTML_PATH, 'r', encoding='utf-8') as fh:
                content = fh.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except IOError:
            self.send_error(500, 'HTML file not found')

server = http.server.HTTPServer(('0.0.0.0', PORT), BuildDoctorHandler)
print(f'  [BUILD-DOCTOR-UI] Server running on http://localhost:{PORT}')
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\n  [BUILD-DOCTOR-UI] Stopped.')
    server.server_close()
"
