'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_HEALTH } from '@/lib/mock-data';
import { TENANT_STATUS_CONFIG } from '@/lib/constants';

export default function HealthPage() {
  const [results, setResults] = useState(MOCK_HEALTH);
  const [checking, setChecking] = useState(false);

  const healthyCount = results.filter((r) => r.health.dbConnected && r.health.storageAvailable).length;
  const unhealthyCount = results.length - healthyCount;

  const runCheck = () => {
    setChecking(true);
    setTimeout(() => {
      setResults([...MOCK_HEALTH]);
      setChecking(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#475569]">チェック対象</p>
          <p className="text-3xl font-bold mt-1 text-[#0F172A]">{results.length} <span className="text-sm font-normal">テナント</span></p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#475569]">正常</p>
          <p className="text-3xl font-bold mt-1 text-[#16A34A]">{healthyCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#475569]">異常</p>
          <p className="text-3xl font-bold mt-1 text-[#DC2626]">{unhealthyCount}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={runCheck} disabled={checking}>
          {checking ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              チェック中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              ヘルスチェック実行
            </>
          )}
        </Button>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader title="テナント別ヘルスステータス" />
        <CardBody className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-left">
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">テナント</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">ステータス</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase text-center">DB</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase text-center">ストレージ</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase text-right">レスポンス</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">問題</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const tenantStatus = TENANT_STATUS_CONFIG[result.status];
                const isHealthy = result.health.dbConnected && result.health.storageAvailable;
                return (
                  <tr key={result.tenantId} className={`border-b border-[#F1F5F9] ${!isHealthy ? 'bg-[#FEF2F2]' : 'hover:bg-[#F8FAFC]'}`}>
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-[#0F172A]">{result.companyNameJa}</p>
                      <p className="text-xs text-[#94A3B8]">{result.tenantCode}</p>
                    </td>
                    <td className="px-6 py-3">
                      <Badge label={tenantStatus.label} color={tenantStatus.color} bgColor={tenantStatus.bgColor} />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <HealthDot ok={result.health.dbConnected} />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <HealthDot ok={result.health.storageAvailable} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`text-sm font-mono ${result.health.apiResponseMs > 100 ? 'text-[#D97706]' : result.health.apiResponseMs > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        {result.health.apiResponseMs > 0 ? `${result.health.apiResponseMs}ms` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {result.health.issues.length > 0 ? (
                        <span className="text-xs text-[#DC2626]">{result.health.issues.join(', ')}</span>
                      ) : (
                        <span className="text-xs text-[#16A34A]">問題なし</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function HealthDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-3 h-3 rounded-full ${ok ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
  );
}
