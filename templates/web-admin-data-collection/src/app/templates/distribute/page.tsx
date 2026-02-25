'use client';

import { useEffect, useState } from 'react';

interface SavedTemplate {
  id: string;
  nameJa: string;
  name: string;
  category: string;
  version: number;
  fieldCount: number;
  status: string;
}

interface TenantOption {
  id: string;
  tenantName: string;
  tenantCode: string;
  status: string;
}

export default function TemplateDistributePage() {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [distributing, setDistributing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch from API
    setTemplates([
      { id: '1', nameJa: '月次売上報告', name: 'Monthly Sales Report', category: '経理', version: 3, fieldCount: 12, status: 'draft' },
      { id: '2', nameJa: '四半期人事レポート', name: 'Quarterly HR Report', category: '人事', version: 1, fieldCount: 8, status: 'draft' },
    ]);
    setTenants([
      { id: 't1', tenantName: 'A社', tenantCode: 'company-a', status: 'active' },
      { id: 't2', tenantName: 'B社', tenantCode: 'company-b', status: 'active' },
      { id: 't3', tenantName: 'C社', tenantCode: 'company-c', status: 'active' },
    ]);
  }, []);

  const toggleTenant = (id: string) => {
    setSelectedTenants((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const selectAllTenants = () => {
    if (selectedTenants.length === tenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(tenants.map((t) => t.id));
    }
  };

  const handleDistribute = async () => {
    if (!selectedTemplate || selectedTenants.length === 0) return;
    setDistributing(true);
    setResult(null);

    try {
      // TODO: Call API
      await new Promise((r) => setTimeout(r, 1500));
      setResult(`${selectedTenants.length} テナントにテンプレートを配布しました。`);
    } catch (e) {
      setResult(`エラー: ${e}`);
    } finally {
      setDistributing(false);
    }
  };

  const selected = templates.find((t) => t.id === selectedTemplate);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">テンプレート配布</h1>
          <p className="mt-1 text-sm text-slate-500">
            保存済みテンプレートを選択テナントに公開・配布
          </p>
        </div>
        <a
          href="/templates"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          ← テンプレート一覧へ
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* Left: Template selector */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-800">配布するテンプレート</h2>
          <div className="mt-4 space-y-2">
            {templates.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                  selectedTemplate === t.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={selectedTemplate === t.id}
                  onChange={() => setSelectedTemplate(t.id)}
                  className="text-blue-600"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{t.nameJa}</div>
                  <div className="text-xs text-slate-400">
                    {t.category} | v{t.version} | {t.fieldCount} フィールド
                  </div>
                </div>
              </label>
            ))}
          </div>

          {selected && (
            <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs text-blue-700">
              選択中: <strong>{selected.nameJa}</strong> (v{selected.version}, {selected.fieldCount} フィールド)
            </div>
          )}
        </div>

        {/* Right: Tenant selector */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">配布先テナント</h2>
            <button
              onClick={selectAllTenants}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {selectedTenants.length === tenants.length ? '全解除' : '全選択'}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {tenants.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                  selectedTenants.includes(t.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTenants.includes(t.id)}
                  onChange={() => toggleTenant(t.id)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">{t.tenantName}</div>
                  <div className="text-xs text-slate-400">{t.tenantCode}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-4 rounded-md bg-green-50 p-4 text-sm text-green-700">{result}</div>
      )}

      <div className="mt-6">
        <button
          onClick={handleDistribute}
          disabled={!selectedTemplate || selectedTenants.length === 0 || distributing}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {distributing
            ? '配布中...'
            : `${selectedTenants.length} テナントに配布`}
        </button>
      </div>
    </div>
  );
}
