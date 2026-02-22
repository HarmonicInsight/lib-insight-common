'use client';

import { useEffect, useState } from 'react';

interface CollectionRow {
  tenantName: string;
  tenantCode: string;
  publishedTemplates: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
}

export default function CollectionPage() {
  const [data, setData] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API
    setData([
      {
        tenantName: 'A社',
        tenantCode: 'company-a',
        publishedTemplates: 5,
        totalSubmissions: 120,
        acceptedSubmissions: 110,
        acceptanceRate: 92,
      },
      {
        tenantName: 'B社',
        tenantCode: 'company-b',
        publishedTemplates: 8,
        totalSubmissions: 200,
        acceptedSubmissions: 130,
        acceptanceRate: 65,
      },
    ]);
    setLoading(false);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">回収状況</h1>
      <p className="mt-1 text-sm text-slate-500">全テナント横断の回収状況ダッシュボード</p>

      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                テナント
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                テンプレート数
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                送信数
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                承認数
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                回収率
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-slate-400">
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
                    {row.publishedTemplates}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">
                    {row.totalSubmissions}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">
                    {row.acceptedSubmissions}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <RateBadge rate={row.acceptanceRate} />
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

function RateBadge({ rate }: { rate: number }) {
  let color = 'bg-red-100 text-red-800';
  if (rate >= 80) color = 'bg-green-100 text-green-800';
  else if (rate >= 50) color = 'bg-yellow-100 text-yellow-800';

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${color}`}>
      {rate}%
    </span>
  );
}
