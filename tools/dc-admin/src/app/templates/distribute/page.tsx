'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_TENANTS } from '@/lib/mock-data';
import { TEMPLATE_STATUS_CONFIG, TENANT_STATUS_CONFIG } from '@/lib/constants';

const AVAILABLE_TEMPLATES = [
  { id: 'tmpl-001', nameJa: '月次売上報告', category: '経理', version: 3, status: 'published' as const },
  { id: 'tmpl-002', nameJa: '経費精算書', category: '経理', version: 2, status: 'published' as const },
  { id: 'tmpl-003', nameJa: '人員計画', category: '人事', version: 1, status: 'draft' as const },
  { id: 'tmpl-004', nameJa: '四半期業績報告', category: '経営', version: 1, status: 'published' as const },
  { id: 'tmpl-005', nameJa: '予算申請書', category: '経理', version: 2, status: 'published' as const },
];

export default function TemplateDistributionPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set());
  const [overwrite, setOverwrite] = useState(false);

  const activeTenants = MOCK_TENANTS.filter((t) => t.status === 'active');

  const toggleTenant = (id: string) => {
    setSelectedTenants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTenants.size === activeTenants.length) {
      setSelectedTenants(new Set());
    } else {
      setSelectedTenants(new Set(activeTenants.map((t) => t.id)));
    }
  };

  const handleDistribute = () => {
    if (!selectedTemplate || selectedTenants.size === 0) return;
    const tmpl = AVAILABLE_TEMPLATES.find((t) => t.id === selectedTemplate);
    alert(`「${tmpl?.nameJa}」を ${selectedTenants.size} テナントに配布しました（モック）`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection */}
        <Card>
          <CardHeader title="テンプレート選択" subtitle="配布するテンプレートを選択してください" />
          <CardBody className="space-y-2">
            {AVAILABLE_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.id;
              const tmplStatus = TEMPLATE_STATUS_CONFIG[tmpl.status];
              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#DBEAFE]'
                      : 'border-[#E2E8F0] hover:border-[#94A3B8]'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{tmpl.nameJa}</p>
                    <p className="text-xs text-[#475569]">{tmpl.category} | v{tmpl.version}</p>
                  </div>
                  <Badge label={tmplStatus.label} color={tmplStatus.color} bgColor={tmplStatus.bgColor} />
                </button>
              );
            })}
          </CardBody>
        </Card>

        {/* Tenant Selection */}
        <Card>
          <CardHeader
            title="配布先テナント"
            subtitle={`${selectedTenants.size}/${activeTenants.length} 社選択中`}
            action={
              <button onClick={selectAll} className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                {selectedTenants.size === activeTenants.length ? 'すべて解除' : 'すべて選択'}
              </button>
            }
          />
          <CardBody className="space-y-2">
            {activeTenants.map((tenant) => {
              const isSelected = selectedTenants.has(tenant.id);
              const tenantStatus = TENANT_STATUS_CONFIG[tenant.status];
              return (
                <button
                  key={tenant.id}
                  onClick={() => toggleTenant(tenant.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#DBEAFE]'
                      : 'border-[#E2E8F0] hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'border-[#2563EB] bg-[#2563EB]' : 'border-[#E2E8F0]'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{tenant.companyNameJa}</p>
                      <p className="text-xs text-[#475569]">{tenant.code} | {tenant.plan}</p>
                    </div>
                  </div>
                  <Badge label={tenantStatus.label} color={tenantStatus.color} bgColor={tenantStatus.bgColor} />
                </button>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-sm text-[#0F172A]">既存テンプレートを上書きする</span>
              </label>
              {overwrite && (
                <span className="text-xs text-[#D97706]">
                  既に配布済みのテンプレートが最新バージョンで上書きされます
                </span>
              )}
            </div>
            <Button
              onClick={handleDistribute}
              disabled={!selectedTemplate || selectedTenants.size === 0}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {selectedTenants.size} テナントに配布
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
