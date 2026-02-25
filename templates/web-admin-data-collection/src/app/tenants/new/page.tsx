'use client';

import { useState } from 'react';

export default function TenantCreatePage() {
  const [form, setForm] = useState({
    tenantName: '',
    tenantCode: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceRoleKey: '',
    licenseKey: '',
    provisionedBy: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      // TODO: Get Firebase token, call provisionTenant()
      setResult('テナントが作成されました（API 接続後に実際のプロビジョニングが実行されます）');
    } catch (err) {
      setResult(`エラー: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">テナント新規作成</h1>
      <p className="mt-1 text-sm text-slate-500">
        顧客用の Supabase プロジェクトを登録してデータ収集環境をセットアップします
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-lg bg-white p-6 shadow">
        {/* Step 1: 基本情報 */}
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">1. 基本情報</legend>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <Input
              label="企業名"
              value={form.tenantName}
              onChange={(v) => setForm({ ...form, tenantName: v })}
              required
            />
            <Input
              label="テナントコード"
              value={form.tenantCode}
              onChange={(v) => setForm({ ...form, tenantCode: v })}
              placeholder="acme-corp"
              required
            />
          </div>
        </fieldset>

        {/* Step 2: Supabase 接続情報 */}
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">2. Supabase 接続情報</legend>
          <div className="mt-3 space-y-4">
            <Input
              label="Supabase URL"
              value={form.supabaseUrl}
              onChange={(v) => setForm({ ...form, supabaseUrl: v })}
              placeholder="https://xxx.supabase.co"
              required
            />
            <Input
              label="Anon Key"
              value={form.supabaseAnonKey}
              onChange={(v) => setForm({ ...form, supabaseAnonKey: v })}
              required
            />
            <Input
              label="Service Role Key"
              value={form.supabaseServiceRoleKey}
              onChange={(v) => setForm({ ...form, supabaseServiceRoleKey: v })}
              type="password"
              required
            />
          </div>
        </fieldset>

        {/* Step 3: ライセンス連携 */}
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">3. ライセンス連携</legend>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <Input
              label="ライセンスキー"
              value={form.licenseKey}
              onChange={(v) => setForm({ ...form, licenseKey: v })}
              placeholder="IOSH-PRO-2601-XXXX-XXXX-XXXX"
            />
            <Input
              label="担当コンサル"
              value={form.provisionedBy}
              onChange={(v) => setForm({ ...form, provisionedBy: v })}
              required
            />
          </div>
        </fieldset>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700">メモ</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {result && (
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">{result}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'プロビジョニング中...' : 'テナントを作成'}
          </button>
          <a
            href="/tenants"
            className="rounded-md border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </a>
        </div>
      </form>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
