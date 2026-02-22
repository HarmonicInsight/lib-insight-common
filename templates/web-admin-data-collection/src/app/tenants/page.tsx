'use client';

import { useEffect, useState } from 'react';

interface TenantRow {
  id: string;
  tenant_name: string;
  tenant_code: string;
  status: string;
  provisioned_at: string;
  templateCount?: number;
  acceptanceRate?: number;
  aiCalls?: number;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API
    setTenants([
      {
        id: '1',
        tenant_name: 'A社',
        tenant_code: 'company-a',
        status: 'active',
        provisioned_at: '2026-01-15T00:00:00Z',
        templateCount: 5,
        acceptanceRate: 92,
        aiCalls: 120,
      },
      {
        id: '2',
        tenant_name: 'B社',
        tenant_code: 'company-b',
        status: 'active',
        provisioned_at: '2026-02-01T00:00:00Z',
        templateCount: 8,
        acceptanceRate: 65,
        aiCalls: 340,
      },
      {
        id: '3',
        tenant_name: 'C社',
        tenant_code: 'company-c',
        status: 'suspended',
        provisioned_at: '2025-12-01T00:00:00Z',
        templateCount: 3,
        acceptanceRate: 0,
        aiCalls: 0,
      },
    ]);
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">テナント管理</h1>
          <p className="mt-1 text-sm text-slate-500">顧客環境の一覧・管理</p>
        </div>
        <a
          href="/tenants/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規テナント作成
        </a>
      </div>

      {/* Tenant table */}
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                企業名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                ステータス
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                テンプレート
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                回収率
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                AI利用
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-slate-400">
                  読み込み中...
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{t.tenant_name}</div>
                    <div className="text-xs text-slate-400">{t.tenant_code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">
                    {t.templateCount}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">
                    {t.status === 'active' ? `${t.acceptanceRate}%` : '--'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">
                    {t.aiCalls}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/tenants/${t.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      詳細
                    </a>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-yellow-100 text-yellow-800',
    decommissioned: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    active: '稼働中',
    suspended: '停止',
    decommissioned: '廃止',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-800'}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
