'use client';

import { useState } from 'react';

export default function TemplateDistributionPage() {
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">テンプレート配布</h1>
      <p className="mt-1 text-sm text-slate-500">
        テンプレートを選択テナントに一括配布
      </p>

      <div className="mt-6 grid grid-cols-2 gap-6">
        {/* Left: Template selector */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-800">テンプレート選択</h2>
          <p className="mt-2 text-sm text-slate-500">
            配布するテンプレートの JSON 定義をアップロードまたは入力してください。
          </p>
          <textarea
            className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
            rows={12}
            placeholder='{ "name": "Monthly Report", "name_ja": "月次報告", ... }'
          />
        </div>

        {/* Right: Tenant selector */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-800">配布先テナント</h2>
          <p className="mt-2 text-sm text-slate-500">
            配布先のテナントを選択してください。
          </p>
          <div className="mt-4 space-y-2">
            {/* TODO: Fetch actual tenants */}
            {['A社 (company-a)', 'B社 (company-b)', 'C社 (company-c)'].map((tenant, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTenants.includes(String(i))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTenants([...selectedTenants, String(i)]);
                    } else {
                      setSelectedTenants(selectedTenants.filter((t) => t !== String(i)));
                    }
                  }}
                  className="rounded border-slate-300"
                />
                {tenant}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          disabled={selectedTenants.length === 0}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {selectedTenants.length} テナントに配布
        </button>
      </div>
    </div>
  );
}
