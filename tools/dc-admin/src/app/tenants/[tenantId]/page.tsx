'use client';

import { use } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getMockTenantDetail } from '@/lib/mock-data';
import { TENANT_STATUS_CONFIG, TEMPLATE_STATUS_CONFIG, SUBMISSION_STATUS_CONFIG, SCHEDULE_LABELS } from '@/lib/constants';

export default function TenantDetailPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  const tenant = getMockTenantDetail(tenantId);

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-64 text-[#94A3B8]">
        テナントが見つかりません
      </div>
    );
  }

  const statusConfig = TENANT_STATUS_CONFIG[tenant.status];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/tenants" className="text-[#475569] hover:text-[#2563EB]">テナント管理</Link>
          <span className="text-[#94A3B8]">/</span>
          <span className="text-[#0F172A] font-medium">{tenant.companyNameJa}</span>
        </div>
        <div className="flex items-center gap-2">
          {tenant.status === 'active' && (
            <Button variant="secondary" size="sm" className="text-[#D97706]">停止</Button>
          )}
          {tenant.status === 'suspended' && (
            <Button variant="secondary" size="sm" className="text-[#16A34A]">再開</Button>
          )}
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="テナント情報" />
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="テナントコード" value={tenant.code} />
              <InfoRow label="企業名" value={tenant.companyNameJa} />
              <InfoRow label="ステータス">
                <Badge label={statusConfig.label} color={statusConfig.color} bgColor={statusConfig.bgColor} />
              </InfoRow>
              <InfoRow label="プラン" value={tenant.plan} />
              <InfoRow label="リージョン" value={tenant.region} />
              <InfoRow label="Supabase Ref" value={tenant.supabaseProjectRef} mono />
              <InfoRow label="担当者" value={`${tenant.contactName} (${tenant.contactEmail})`} />
              <InfoRow label="作成日" value={new Date(tenant.createdAt).toLocaleDateString('ja-JP')} />
            </div>
          </CardBody>
        </Card>

        {/* Health */}
        <Card>
          <CardHeader title="ヘルスステータス" />
          <CardBody className="space-y-3">
            <HealthItem
              label="DB 接続"
              ok={tenant.healthStatus.dbConnected}
            />
            <HealthItem
              label="ストレージ"
              ok={tenant.healthStatus.storageAvailable}
            />
            <HealthItem
              label="API レスポンス"
              ok={tenant.healthStatus.apiResponseMs > 0}
              detail={tenant.healthStatus.apiResponseMs > 0 ? `${tenant.healthStatus.apiResponseMs}ms` : 'N/A'}
            />
            {tenant.healthStatus.issues.length > 0 && (
              <div className="mt-3 p-3 bg-[#FEE2E2] rounded-lg">
                <p className="text-xs font-medium text-[#DC2626]">問題:</p>
                {tenant.healthStatus.issues.map((issue, i) => (
                  <p key={i} className="text-xs text-[#DC2626] mt-1">{issue}</p>
                ))}
              </div>
            )}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <div className="flex justify-between text-xs text-[#475569]">
                <span>ストレージ使用量</span>
                <span className="font-medium">{tenant.storageUsedMb} MB</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <MiniStat label="テンプレート数" value={tenant.templateCount} />
        <MiniStat label="送信数" value={tenant.submissionCount} />
        <MiniStat label="回収率" value={`${tenant.collectionRate}%`} color={tenant.collectionRate >= 80 ? '#16A34A' : '#D97706'} />
        <MiniStat label="AI利用(今月)" value={tenant.aiUsageThisMonth} />
      </div>

      {/* Templates */}
      <Card>
        <CardHeader title="テンプレート一覧" subtitle={`${tenant.templates.length} 件`} />
        <CardBody className="p-0">
          {tenant.templates.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left">
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">テンプレート名</th>
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">カテゴリ</th>
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">スケジュール</th>
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">ステータス</th>
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">締切</th>
                </tr>
              </thead>
              <tbody>
                {tenant.templates.map((tmpl) => {
                  const tmplStatus = TEMPLATE_STATUS_CONFIG[tmpl.status];
                  return (
                    <tr key={tmpl.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: tmpl.tabColor }} />
                          <div>
                            <p className="text-sm font-medium text-[#0F172A]">{tmpl.nameJa}</p>
                            <p className="text-xs text-[#94A3B8]">v{tmpl.version}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-[#475569]">{tmpl.category}</td>
                      <td className="px-6 py-3 text-sm text-[#475569]">{SCHEDULE_LABELS[tmpl.schedule]?.ja || tmpl.schedule}</td>
                      <td className="px-6 py-3">
                        <Badge label={tmplStatus.label} color={tmplStatus.color} bgColor={tmplStatus.bgColor} />
                      </td>
                      <td className="px-6 py-3 text-sm text-[#475569]">
                        {tmpl.deadline ? new Date(tmpl.deadline).toLocaleDateString('ja-JP') : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-sm text-[#94A3B8]">テンプレートがありません</div>
          )}
        </CardBody>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader title="最近の送信" subtitle={`${tenant.recentSubmissions.length} 件`} />
        <CardBody className="p-0">
          {tenant.recentSubmissions.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left">
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">送信者</th>
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">ステータス</th>
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">AI転記</th>
                  <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase">送信日時</th>
                </tr>
              </thead>
              <tbody>
                {tenant.recentSubmissions.map((sub) => {
                  const subStatus = SUBMISSION_STATUS_CONFIG[sub.status];
                  return (
                    <tr key={sub.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      <td className="px-6 py-3">
                        <p className="text-sm text-[#0F172A]">{sub.submitterName || sub.submitterEmail}</p>
                        <p className="text-xs text-[#94A3B8]">{sub.submitterEmail}</p>
                      </td>
                      <td className="px-6 py-3">
                        <Badge label={subStatus.label} color={subStatus.color} bgColor={subStatus.bgColor} />
                      </td>
                      <td className="px-6 py-3 text-sm text-[#475569]">
                        {sub.aiTransferUsed ? (
                          <span className="text-[#2563EB]">AI</span>
                        ) : (
                          <span className="text-[#94A3B8]">手動</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-[#475569]">
                        {new Date(sub.submittedAt).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-sm text-[#94A3B8]">送信データがありません</div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[#475569] mb-0.5">{label}</p>
      {children || (
        <p className={`text-sm font-medium text-[#0F172A] ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
      )}
    </div>
  );
}

function HealthItem({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${ok ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
        <span className="text-sm text-[#0F172A]">{label}</span>
      </div>
      {detail && <span className="text-xs text-[#475569]">{detail}</span>}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
      <p className="text-xs text-[#475569]">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color: color || '#0F172A' }}>{value}</p>
    </div>
  );
}
