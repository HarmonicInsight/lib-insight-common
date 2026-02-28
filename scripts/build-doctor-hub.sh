#!/usr/bin/env bash
# =============================================================================
# Build Doctor Hub — 全プロジェクト一元管理ダッシュボード
#
# 使い方:
#   ./scripts/build-doctor-hub.sh ~/Projects        # 親ディレクトリを指定
#   ./scripts/build-doctor-hub.sh --port 9000       # ポート変更
#
# 動作:
#   1) 指定ディレクトリ配下の全プロジェクトを自動検出
#   2) 各プロジェクトの build_logs/ からレポートを集約
#   3) ブラウザで全プロジェクトのビルド状況を一覧表示
#
# 自動検出対象:
#   - build_logs/ があるプロジェクト
#   - HARMONIC insight 製品リポジトリ名にマッチするディレクトリ
#   - .xcodeproj / build.gradle.kts / *.csproj / package.json 等
#
# 必要なもの: Python 3.x
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="${1:-$HOME}"
PORT=8788

# 引数解析
args=("$@")
for ((i=0; i<${#args[@]}; i++)); do
  case "${args[$i]}" in
    --port) PORT="${args[$((i+1))]}"; ((i++)) ;;
    -*) ;;
    *) PARENT_DIR="${args[$i]}" ;;
  esac
done

# 絶対パスに変換
PARENT_DIR=$(cd "$PARENT_DIR" 2>/dev/null && pwd)

echo ""
echo "  ══════════════════════════════════════════════"
echo "  Build Doctor Hub — Multi-Project Dashboard"
echo "  ══════════════════════════════════════════════"
echo ""
echo "  Scan root:  $PARENT_DIR"
echo "  URL:        http://localhost:${PORT}"
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
    echo "[HUB] ブラウザを開いてください: http://localhost:${PORT}"
  fi
) &

# Python サーバー起動
python3 -c "
import http.server
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import datetime

PARENT_DIR = Path('''${PARENT_DIR}''')
HTML_PATH = Path('''${SCRIPT_DIR}/build-doctor-hub.html''')
PORT = int('''${PORT}''')

# =================================================================
# 製品レジストリ（CLAUDE.md の製品コード一覧と対応）
# =================================================================
PRODUCT_REGISTRY = {
    'win-app-nocode-analyzer':      {'code': 'INCA',  'name': 'InsightNoCodeAnalyzer',  'tier': 1, 'tech': 'Tauri',   'platform': 'tauri'},
    'win-app-insight-bot':          {'code': 'INBT',  'name': 'InsightBot',             'tier': 1, 'tech': 'C# WPF',  'platform': 'wpf'},
    'web-app-auto-interview':       {'code': 'IVIN',  'name': 'InterviewInsight',       'tier': 1, 'tech': 'Tauri',   'platform': 'tauri'},
    'win-app-insight-cast':         {'code': 'INMV',  'name': 'InsightCast',            'tier': 2, 'tech': 'Python',  'platform': 'python'},
    'win-app-insight-image-gen':    {'code': 'INIG',  'name': 'InsightImageGen',        'tier': 2, 'tech': 'Python',  'platform': 'python'},
    'win-app-insight-slide':        {'code': 'INSS',  'name': 'Insight Deck Quality Gate', 'tier': 3, 'tech': 'C# WPF',  'platform': 'wpf'},
    'win-app-insight-sheet':        {'code': 'IOSH',  'name': 'Insight Performance Management', 'tier': 3, 'tech': 'C# WPF',  'platform': 'wpf'},
    'win-app-insight-doc':          {'code': 'IOSD',  'name': 'Insight AI Briefcase',   'tier': 3, 'tech': 'C# WPF',  'platform': 'wpf'},
    'win-app-insight-py':           {'code': 'INPY',  'name': 'InsightPy',              'tier': 3, 'tech': 'C# WPF',  'platform': 'wpf'},
    'win-app-insight-py-pro':       {'code': 'INPY',  'name': 'InsightPy PRO',          'tier': 3, 'tech': 'C# WPF',  'platform': 'wpf'},
    'win-app-insight-sheet-senior': {'code': 'ISOF',  'name': 'InsightSeniorOffice',    'tier': 4, 'tech': 'C# WPF',  'platform': 'wpf'},
    'win-app-insight-launcher':     {'code': 'LAUNCHER', 'name': 'InsightLauncher',     'tier': 0, 'tech': 'C# WPF',  'platform': 'wpf'},
    'android-app-insight-launcher': {'code': 'LAUNCHER', 'name': 'InsightLauncher Android', 'tier': 0, 'tech': 'Kotlin', 'platform': 'android'},
    'android-app-insight-camera':   {'code': 'CAMERA',   'name': 'InsightCamera',       'tier': 0, 'tech': 'Kotlin',  'platform': 'android'},
    'android-app-insight-voice-clock': {'code': 'VOICE_CLOCK', 'name': 'InsightVoiceClock', 'tier': 0, 'tech': 'Kotlin', 'platform': 'android'},
    'web-app-insight-qr':           {'code': 'QR',       'name': 'InsightQR Web',       'tier': 0, 'tech': 'Expo',    'platform': 'react'},
    'android-app-insight-qr':       {'code': 'QR',       'name': 'InsightQR Android',   'tier': 0, 'tech': 'Kotlin',  'platform': 'android'},
    'win-app-insight-pinboard':     {'code': 'PINBOARD', 'name': 'InsightPinBoard',     'tier': 0, 'tech': 'C# WPF',  'platform': 'wpf'},
    'mobile-app-voice-memo':        {'code': 'VOICE_MEMO', 'name': 'InsightVoiceMemo',  'tier': 0, 'tech': 'Expo',    'platform': 'react'},
    'android-app-voice-tesk-calendar': {'code': 'VOICE_TASK_CALENDAR', 'name': 'VoiceTaskCalendar', 'tier': 0, 'tech': 'Kotlin', 'platform': 'android'},
    'android-app-consul-evaluate':  {'code': 'CONSUL_EVAL', 'name': 'ConsulEvaluate',   'tier': 0, 'tech': 'Kotlin',  'platform': 'android'},
    'cross-lib-insight-common':     {'code': 'COMMON',   'name': 'insight-common',      'tier': 0, 'tech': 'TypeScript', 'platform': 'react'},
}

# プラットフォーム検出ファイル
PLATFORM_MARKERS = {
    'ios':     ['*.xcodeproj', '*.xcworkspace', 'Package.swift'],
    'android': ['build.gradle.kts', 'build.gradle', 'settings.gradle.kts'],
    'wpf':     ['*.csproj', '*.sln'],
    'tauri':   ['src-tauri/Cargo.toml'],
    'react':   ['next.config.js', 'next.config.ts', 'next.config.mjs', 'package.json'],
    'python':  ['pyproject.toml', 'setup.py', 'requirements.txt'],
}

def detect_platform(project_dir):
    \"\"\"プロジェクトディレクトリからプラットフォームを検出\"\"\"
    d = Path(project_dir)
    for plat, markers in PLATFORM_MARKERS.items():
        for marker in markers:
            if '*' in marker:
                if list(d.glob(marker)):
                    return plat
            elif (d / marker).exists():
                return plat
    return 'unknown'

def scan_projects():
    \"\"\"親ディレクトリ配下の全プロジェクトをスキャン\"\"\"
    projects = []
    seen = set()

    for entry in sorted(PARENT_DIR.iterdir()):
        if not entry.is_dir() or entry.name.startswith('.'):
            continue

        dir_name = entry.name
        if dir_name in seen:
            continue
        seen.add(dir_name)

        # 製品レジストリから情報取得
        reg = PRODUCT_REGISTRY.get(dir_name, None)
        platform = reg['platform'] if reg else detect_platform(entry)

        # build_logs/ の存在チェック
        log_dir = entry / 'build_logs'
        has_logs = log_dir.is_dir()

        # レポート & セッション集計
        reports = []
        session = None
        total_builds = 0
        failed_builds = 0
        last_status = 'unknown'
        last_build_at = None
        categories = {}

        if has_logs:
            # report_*.json を読み込み
            for f in sorted(log_dir.glob('report_*.json'), reverse=True):
                try:
                    with open(f, 'r', encoding='utf-8') as fh:
                        data = json.load(fh)
                        data['_file'] = f.name
                        reports.append(data)
                        total_builds += 1
                        if data.get('status') != 'resolved':
                            failed_builds += 1
                        for loop in data.get('loops', []):
                            cat = loop.get('category', '')
                            if cat and cat != '-':
                                categories[cat] = categories.get(cat, 0) + 1
                except (json.JSONDecodeError, IOError):
                    pass

            # session_report.json
            session_file = log_dir / 'session_report.json'
            if session_file.exists():
                try:
                    with open(session_file, 'r', encoding='utf-8') as fh:
                        session = json.load(fh)
                        total_builds += session.get('totalBuilds', 0)
                        failed_builds += session.get('failedBuilds', 0)
                        for evt in session.get('events', []):
                            cat = evt.get('category', '')
                            if cat:
                                categories[cat] = categories.get(cat, 0) + 1
                except (json.JSONDecodeError, IOError):
                    pass

            # 最新ビルド時刻を取得
            log_files = sorted(log_dir.glob('*.log'), reverse=True)
            if log_files:
                last_build_at = datetime.fromtimestamp(log_files[0].stat().st_mtime).isoformat()

            # 最新ステータス
            if reports:
                last_status = reports[0].get('status', 'unknown')
            elif session and session.get('events'):
                last_evt = session['events'][-1]
                last_status = 'build_failed' if last_evt.get('status') == 'build_failed' else 'resolved'

        projects.append({
            'dirName': dir_name,
            'path': str(entry),
            'code': reg['code'] if reg else dir_name.upper()[:6],
            'name': reg['name'] if reg else dir_name,
            'tier': reg['tier'] if reg else -1,
            'tech': reg['tech'] if reg else '',
            'platform': platform,
            'hasLogs': has_logs,
            'totalBuilds': total_builds,
            'failedBuilds': failed_builds,
            'lastStatus': last_status,
            'lastBuildAt': last_build_at,
            'categories': categories,
            'reportCount': len(reports),
            'hasSession': session is not None,
        })

    # ティア順 → 名前順でソート
    projects.sort(key=lambda p: (p['tier'] if p['tier'] >= 0 else 99, p['name']))
    return projects

# =================================================================
# HTTP Server
# =================================================================

class HubHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        path = args[0].split()[1] if args else ''
        if '/api/' in str(path):
            super().log_message(fmt, *args)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path == '/api/projects':
            self.send_projects()
        elif path == '/api/project/reports':
            self.send_project_reports(qs)
        elif path == '/api/project/session':
            self.send_project_session(qs)
        elif path == '/' or path == '/index.html':
            self.send_html()
        else:
            self.send_error(404)

    def send_json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def send_projects(self):
        projects = scan_projects()
        self.send_json(projects)

    def send_project_reports(self, qs):
        dir_name = qs.get('dir', [''])[0]
        if not dir_name or '..' in dir_name or '/' in dir_name:
            self.send_json([])
            return
        log_dir = PARENT_DIR / dir_name / 'build_logs'
        reports = []
        if log_dir.exists():
            for f in sorted(log_dir.glob('report_*.json'), reverse=True):
                try:
                    with open(f, 'r', encoding='utf-8') as fh:
                        data = json.load(fh)
                        data['_file'] = f.name
                        reports.append(data)
                except (json.JSONDecodeError, IOError):
                    pass
        self.send_json(reports)

    def send_project_session(self, qs):
        dir_name = qs.get('dir', [''])[0]
        if not dir_name or '..' in dir_name or '/' in dir_name:
            self.send_json({})
            return
        session_file = PARENT_DIR / dir_name / 'build_logs' / 'session_report.json'
        if session_file.exists():
            try:
                with open(session_file, 'r', encoding='utf-8') as fh:
                    self.send_json(json.load(fh))
                    return
            except (json.JSONDecodeError, IOError):
                pass
        self.send_json({})

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

server = http.server.HTTPServer(('0.0.0.0', PORT), HubHandler)
print(f'  [HUB] Scanning: {PARENT_DIR}')
print(f'  [HUB] Server running on http://localhost:{PORT}')
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\n  [HUB] Stopped.')
    server.server_close()
"
