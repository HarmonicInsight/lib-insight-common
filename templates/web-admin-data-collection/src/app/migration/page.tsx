'use client';

import { useState } from 'react';

export default function MigrationPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Array<{ tenantCode: string; success: boolean; message: string }>>([]);

  const handleRunMigration = async () => {
    setRunning(true);
    // TODO: Call runMigration() API
    setTimeout(() => {
      setResults([
        { tenantCode: 'company-a', success: true, message: 'Tables verified successfully' },
        { tenantCode: 'company-b', success: true, message: 'Tables verified successfully' },
        { tenantCode: 'company-c', success: false, message: 'Connection failed' },
      ]);
      setRunning(false);
    }, 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">マイグレーション</h1>
      <p className="mt-1 text-sm text-slate-500">
        スキーマ更新を全テナント（または選択テナント）に適用
      </p>

      <div className="mt-6 rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-800">マイグレーション実行</h2>
        <p className="mt-2 text-sm text-slate-500">
          全稼働中テナントの dc_ テーブル構成を確認し、必要に応じてスキーマを更新します。
        </p>

        <div className="mt-4 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          現在のバージョン: migration-001-init.sql
        </div>

        <button
          onClick={handleRunMigration}
          disabled={running}
          className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? '実行中...' : '全テナントに実行'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm font-semibold text-slate-700">実行結果</h3>
          <div className="mt-3 space-y-2">
            {results.map((r) => (
              <div
                key={r.tenantCode}
                className={`flex items-center justify-between rounded-md p-3 text-sm ${
                  r.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}
              >
                <span className="font-medium">{r.tenantCode}</span>
                <span>{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
