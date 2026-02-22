'use client';

import { useEffect, useState } from 'react';

interface AiUsageRow {
  tenantName: string;
  tenantCode: string;
  aiTransfers: number;
  aiValidations: number;
  totalAiCalls: number;
}

export default function AiUsagePage() {
  const [data, setData] = useState<AiUsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    // TODO: Fetch from API
    setData([
      { tenantName: 'A社', tenantCode: 'company-a', aiTransfers: 80, aiValidations: 40, totalAiCalls: 120 },
      { tenantName: 'B社', tenantCode: 'company-b', aiTransfers: 220, aiValidations: 120, totalAiCalls: 340 },
    ]);
    setLoading(false);
  }, [selectedMonth]);

  const totalCalls = data.reduce((sum, r) => sum + r.totalAiCalls, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI 利用量</h1>
          <p className="mt-1 text-sm text-slate-500">テナント別の AI 利用量モニタリング</p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-lg border-l-4 border-purple-500 bg-purple-50 p-5">
        <p className="text-sm text-slate-500">{selectedMonth} の合計 AI 利用量</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{totalCalls.toLocaleString()} 回</p>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                テナント
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                AI 転記
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                AI 検証
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                合計
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-slate-400">
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
                  <td className="px-6 py-4 text-right text-sm text-slate-700">
                    {row.aiTransfers}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">
                    {row.aiValidations}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    {row.totalAiCalls}
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
