'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_TENANTS } from '@/lib/mock-data';
import { TENANT_STATUS_CONFIG } from '@/lib/constants';
import type { TenantStatus } from '@/types';

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');

  const filtered = MOCK_TENANTS.filter((t) => {
    const matchesSearch =
      t.companyNameJa.includes(search) ||
      t.companyName.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#475569]">登録済みテナント: {MOCK_TENANTS.length} 社</p>
        </div>
        <Link href="/tenants/new">
          <Button>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            テナント追加
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="企業名・コードで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          />
        </div>

        <div className="flex gap-1 bg-white border border-[#E2E8F0] rounded-lg p-1">
          {(['all', 'active', 'suspended', 'provisioning', 'decommissioned'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === status
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#475569] hover:bg-[#F1F5F9]'
              }`}
            >
              {status === 'all' ? 'すべて' : TENANT_STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tenant Table */}
      <Card>
        <CardBody className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-left">
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase tracking-wider">企業名</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase tracking-wider">ステータス</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase tracking-wider">プラン</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase tracking-wider text-right">テンプレ</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase tracking-wider text-right">回収率</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase tracking-wider text-right">AI利用</th>
                <th className="px-6 py-3 text-xs font-medium text-[#475569] uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => {
                const statusConfig = TENANT_STATUS_CONFIG[tenant.status];
                return (
                  <tr key={tenant.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/tenants/${tenant.id}`} className="text-sm font-medium text-[#0F172A] hover:text-[#2563EB]">
                        {tenant.companyNameJa}
                      </Link>
                      <p className="text-xs text-[#94A3B8]">{tenant.code} | {tenant.region}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge label={statusConfig.label} color={statusConfig.color} bgColor={statusConfig.bgColor} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#0F172A]">{tenant.plan}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[#0F172A]">{tenant.templateCount}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-medium ${tenant.collectionRate >= 80 ? 'text-[#16A34A]' : tenant.collectionRate >= 50 ? 'text-[#D97706]' : 'text-[#475569]'}`}>
                        {tenant.collectionRate > 0 ? `${tenant.collectionRate}%` : '--'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[#0F172A]">
                      {tenant.aiUsageThisMonth > 0 ? tenant.aiUsageThisMonth.toLocaleString() : '--'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="sm">詳細</Button>
                        </Link>
                        {tenant.status === 'active' && (
                          <Button variant="ghost" size="sm" className="text-[#D97706]">停止</Button>
                        )}
                        {tenant.status === 'suspended' && (
                          <Button variant="ghost" size="sm" className="text-[#16A34A]">再開</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-[#94A3B8]">
              該当するテナントがありません
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
