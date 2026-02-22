'use client';

import { useEffect, useState } from 'react';

interface HealthRow {
  tenantCode: string;
  tenantName: string;
  status: 'healthy' | 'unreachable';
  templateCount: number;
}

export default function HealthPage() {
  const [data, setData] = useState<HealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // TODO: Fetch from API
    setData([
      { tenantCode: 'company-a', tenantName: 'A社', status: 'healthy', templateCount: 5 },
      { tenantCode: 'company-b', tenantName: 'B社', status: 'healthy', templateCount: 8 },
      { tenantCode: 'company-c', tenantName: 'C社', status: 'unreachable', templateCount: 0 },
    ]);
    setLoading(false);
  }, []);

  const handleRefresh = async () => {
    setChecking(true);
    // TODO: Call healthCheck()
    setTimeout(() => setChecking(false), 1000);
  };

  const healthyCount = data.filter((d) => d.status === 'healthy').length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ヘルスチェック</h1>
          <p className="mt-1 text-sm text-slate-500">全テナントの DB 接続確認</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={checking}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {checking ? 'チェック中...' : '再チェック'}
        </button>
      </div>

      {/* Summary */}
      <div className="mt-6 flex gap-4">
        <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-5">
          <p className="text-sm text-slate-500">正常</p>
          <p className="text-2xl font-bold text-green-800">{healthyCount}</p>
        </div>
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-5">
          <p className="text-sm text-slate-500">異常</p>
          <p className="text-2xl font-bold text-red-800">{data.length - healthyCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                テナント
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                ステータス
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                テンプレート数
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-slate-400">
                  読み込み中...
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.tenantCode} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{row.tenantName}</div>
                    <div className="text-xs text-slate-400">{row.tenantCode}</div>
                  </td>
                  <td className="px-6 py-4">
                    {row.status === 'healthy' ? (
                      <span className="inline-flex items-center gap-1 text-sm text-green-700">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        正常
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-red-700">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        接続不可
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">
                    {row.templateCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
