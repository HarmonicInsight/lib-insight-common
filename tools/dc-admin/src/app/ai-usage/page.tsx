'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { MOCK_AI_USAGE } from '@/lib/mock-data';

export default function AiUsagePage() {
  const { tenants } = MOCK_AI_USAGE;

  const totalTransfer = tenants.reduce(
    (sum, t) => sum + t.usage.reduce((s, u) => s + u.aiTransferCount, 0), 0
  );
  const totalValidate = tenants.reduce(
    (sum, t) => sum + t.usage.reduce((s, u) => s + u.aiValidateCount, 0), 0
  );
  const thisMonth = tenants.reduce(
    (sum, t) => {
      const latest = t.usage[t.usage.length - 1];
      return sum + (latest?.aiTransferCount || 0) + (latest?.aiValidateCount || 0);
    }, 0
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#475569]">AI利用量（今月）</p>
          <p className="text-3xl font-bold mt-1 text-[#2563EB]">{thisMonth.toLocaleString()} <span className="text-sm font-normal">回</span></p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#475569]">累計 AI転記</p>
          <p className="text-3xl font-bold mt-1 text-[#0F172A]">{totalTransfer.toLocaleString()} <span className="text-sm font-normal">回</span></p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#475569]">累計 AI検証</p>
          <p className="text-3xl font-bold mt-1 text-[#0F172A]">{totalValidate.toLocaleString()} <span className="text-sm font-normal">回</span></p>
        </div>
      </div>

      {/* Per-Tenant Usage */}
      {tenants.map((tenant) => {
        const latestMonth = tenant.usage[tenant.usage.length - 1];
        const maxUsage = Math.max(...tenant.usage.map((u) => u.aiTransferCount + u.aiValidateCount));

        return (
          <Card key={tenant.tenantId}>
            <CardHeader
              title={tenant.companyNameJa}
              subtitle={tenant.tenantCode}
              action={
                <div className="text-right">
                  <p className="text-lg font-bold text-[#2563EB]">
                    {(latestMonth?.aiTransferCount || 0) + (latestMonth?.aiValidateCount || 0)}
                  </p>
                  <p className="text-xs text-[#475569]">今月の利用回数</p>
                </div>
              }
            />
            <CardBody>
              {/* Simple bar chart */}
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-[#475569]">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#2563EB]" />
                    <span>AI転記</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#0EA5E9]" />
                    <span>AI検証</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#E2E8F0]" />
                    <span>送信数</span>
                  </div>
                </div>

                {tenant.usage.map((month) => {
                  const total = month.aiTransferCount + month.aiValidateCount;
                  const barWidth = maxUsage > 0 ? (total / maxUsage) * 100 : 0;
                  const transferWidth = total > 0 ? (month.aiTransferCount / total) * barWidth : 0;
                  const validateWidth = total > 0 ? (month.aiValidateCount / total) * barWidth : 0;

                  return (
                    <div key={month.month} className="flex items-center gap-3">
                      <span className="text-xs text-[#475569] w-16 text-right font-mono">{month.month}</span>
                      <div className="flex-1 flex items-center gap-0.5 h-6">
                        <div
                          className="h-full bg-[#2563EB] rounded-l"
                          style={{ width: `${transferWidth}%` }}
                        />
                        <div
                          className="h-full bg-[#0EA5E9] rounded-r"
                          style={{ width: `${validateWidth}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#0F172A] font-medium w-12 text-right">{total}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
