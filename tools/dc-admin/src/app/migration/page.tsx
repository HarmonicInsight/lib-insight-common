'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_TENANTS } from '@/lib/mock-data';

export default function MigrationPage() {
  const [target, setTarget] = useState<'all' | 'selected'>('all');
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set());
  const [dryRun, setDryRun] = useState(true);
  const [script, setScript] = useState('');

  const activeTenants = MOCK_TENANTS.filter((t) => t.status === 'active');

  const toggleTenant = (id: string) => {
    setSelectedTenants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRun = () => {
    const count = target === 'all' ? activeTenants.length : selectedTenants.size;
    alert(`${dryRun ? '(DRY RUN) ' : ''}マイグレーションを ${count} テナントに実行しました（モック）`);
  };

  const SAMPLE_SCRIPTS = [
    {
      label: 'インデックス追加 (dc_collected_data)',
      script: 'CREATE INDEX IF NOT EXISTS idx_dc_data_reviewed ON dc_collected_data(reviewed_at);',
    },
    {
      label: 'カラム追加 (dc_templates.priority)',
      script: 'ALTER TABLE dc_templates ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;',
    },
    {
      label: 'ビュー再作成 (dc_collection_status)',
      script: 'CREATE OR REPLACE VIEW dc_collection_status AS\nSELECT t.id AS template_id, t.name_ja,\n  COUNT(*) FILTER (WHERE d.status = \'accepted\') AS accepted\nFROM dc_templates t\nLEFT JOIN dc_collected_data d ON d.template_id = t.id\nGROUP BY t.id, t.name_ja;',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="bg-[#FEF3C7] border border-[#D97706] rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-[#92400E]">マイグレーションは全テナントの DB に直接影響します</p>
            <p className="text-xs text-[#92400E] mt-1">必ず DRY RUN で確認してから本番実行してください。</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Script Editor */}
        <Card>
          <CardHeader title="マイグレーションスクリプト" subtitle="実行する SQL を入力してください" />
          <CardBody className="space-y-4">
            {/* Quick templates */}
            <div>
              <p className="text-xs text-[#475569] mb-2">クイックテンプレート:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_SCRIPTS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setScript(s.script)}
                    className="px-2 py-1 text-xs text-[#2563EB] bg-[#DBEAFE] rounded hover:bg-[#BFDBFE] transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="-- SQL マイグレーションスクリプト"
              rows={10}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
            />
          </CardBody>
        </Card>

        {/* Target Selection */}
        <Card>
          <CardHeader title="対象テナント" />
          <CardBody className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setTarget('all')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  target === 'all' ? 'border-[#2563EB] bg-[#DBEAFE] text-[#2563EB]' : 'border-[#E2E8F0] text-[#475569]'
                }`}
              >
                全テナント ({activeTenants.length})
              </button>
              <button
                onClick={() => setTarget('selected')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  target === 'selected' ? 'border-[#2563EB] bg-[#DBEAFE] text-[#2563EB]' : 'border-[#E2E8F0] text-[#475569]'
                }`}
              >
                選択テナント ({selectedTenants.size})
              </button>
            </div>

            {target === 'selected' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activeTenants.map((tenant) => (
                  <label key={tenant.id} className="flex items-center gap-2 p-2 rounded hover:bg-[#F8FAFC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTenants.has(tenant.id)}
                      onChange={() => toggleTenant(tenant.id)}
                      className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-sm text-[#0F172A]">{tenant.companyNameJa}</span>
                    <span className="text-xs text-[#94A3B8]">{tenant.code}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-[#E2E8F0]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-sm text-[#0F172A] font-medium">DRY RUN（実際には実行しない）</span>
              </label>
              <p className="text-xs text-[#475569] mt-1 ml-6">
                DRY RUN を有効にすると、スクリプトの構文チェックのみ実行します。
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Execute */}
      <div className="flex justify-end">
        <Button
          onClick={handleRun}
          disabled={!script.trim()}
          variant={dryRun ? 'primary' : 'danger'}
        >
          {dryRun ? 'DRY RUN 実行' : 'マイグレーション実行'}
        </Button>
      </div>
    </div>
  );
}
