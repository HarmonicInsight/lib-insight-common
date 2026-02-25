'use client';

import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MOCK_DASHBOARD_STATS, MOCK_TENANTS, MOCK_COLLECTION_SUMMARY } from '@/lib/mock-data';
import { TENANT_STATUS_CONFIG } from '@/lib/constants';
import Link from 'next/link';

export default function DashboardPage() {
  const stats = MOCK_DASHBOARD_STATS;
  const tenants = MOCK_TENANTS;
  const collections = MOCK_COLLECTION_SUMMARY;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="稼働テナント"
          value={stats.activeTenants}
          suffix="社"
          color="#2563EB"
          bgColor="#DBEAFE"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="テンプレート総数"
          value={stats.totalTemplates}
          color="#0EA5E9"
          bgColor="#E0F2FE"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <StatCard
          label="全体回収率"
          value={stats.overallCollectionRate}
          suffix="%"
          color="#16A34A"
          bgColor="#DCFCE7"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          label="AI 利用量 (今月)"
          value={stats.totalAiUsageThisMonth.toLocaleString()}
          suffix="回"
          color="#D97706"
          bgColor="#FEF3C7"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant List */}
        <Card>
          <CardHeader
            title="テナント一覧"
            subtitle={`全 ${tenants.length} 社`}
            action={
              <Link href="/tenants" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                すべて表示
              </Link>
            }
          />
          <CardBody className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left">
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase tracking-wider">企業名</th>
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase tracking-wider">ステータス</th>
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase tracking-wider text-right">回収率</th>
                </tr>
              </thead>
              <tbody>
                {tenants.slice(0, 5).map((tenant) => {
                  const statusConfig = TENANT_STATUS_CONFIG[tenant.status];
                  return (
                    <tr key={tenant.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-3">
                        <Link href={`/tenants/${tenant.id}`} className="text-sm font-medium text-[#0F172A] hover:text-[#2563EB]">
                          {tenant.companyNameJa}
                        </Link>
                        <p className="text-xs text-[#94A3B8]">{tenant.code}</p>
                      </td>
                      <td className="px-6 py-3">
                        <Badge label={statusConfig.label} color={statusConfig.color} bgColor={statusConfig.bgColor} />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`text-sm font-medium ${tenant.collectionRate >= 80 ? 'text-[#16A34A]' : tenant.collectionRate >= 50 ? 'text-[#D97706]' : 'text-[#475569]'}`}>
                          {tenant.collectionRate > 0 ? `${tenant.collectionRate}%` : '--'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* Collection Status */}
        <Card>
          <CardHeader
            title="回収状況"
            subtitle="公開中テンプレートの回収率"
            action={
              <Link href="/collection" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                詳細を表示
              </Link>
            }
          />
          <CardBody className="space-y-4">
            {collections.map((item) => {
              const deadline = item.deadline ? new Date(item.deadline) : null;
              const isNearDeadline = deadline && (deadline.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;

              return (
                <div key={item.templateId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{item.templateNameJa}</p>
                      <p className="text-xs text-[#475569]">
                        {item.submittedCount}/{item.totalExpected} 件提出
                        {deadline && (
                          <span className={isNearDeadline ? ' text-[#DC2626] font-medium' : ''}>
                            {' '}| 締切: {deadline.toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className={`text-lg font-bold ${item.collectionRate >= 80 ? 'text-[#16A34A]' : item.collectionRate >= 50 ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>
                      {item.collectionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${item.collectionRate}%`,
                        backgroundColor: item.collectionRate >= 80 ? '#16A34A' : item.collectionRate >= 50 ? '#D97706' : '#DC2626',
                      }}
                    />
                  </div>
                  <div className="flex gap-3 text-xs text-[#475569]">
                    <span className="text-[#16A34A]">承認 {item.acceptedCount}</span>
                    <span className="text-[#2563EB]">送信済 {item.submittedCount - item.acceptedCount - item.rejectedCount}</span>
                    <span className="text-[#DC2626]">却下 {item.rejectedCount}</span>
                    <span>下書き {item.draftCount}</span>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
