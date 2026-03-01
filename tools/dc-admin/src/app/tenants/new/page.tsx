'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TenantCreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    code: '',
    companyName: '',
    companyNameJa: '',
    plan: 'BIZ' as const,
    region: 'ap-northeast-1',
    contactEmail: '',
    contactName: '',
    distributeInitialTemplates: true,
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // TODO: Call provisionTenant API
    alert('テナントを作成しました（モック）');
    router.push('/tenants');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step ? 'bg-[#2563EB] text-white' : 'bg-[#E2E8F0] text-[#475569]'
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`w-16 h-0.5 ${s < step ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'}`} />}
          </div>
        ))}
        <div className="ml-4 text-sm text-[#475569]">
          {step === 1 && '基本情報'}
          {step === 2 && '担当者情報'}
          {step === 3 && '確認'}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader title="基本情報" subtitle="テナントの基本情報を入力してください" />
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">テナントコード</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder="ACME"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <p className="text-xs text-[#94A3B8] mt-1">英数字の短縮コード（Supabase プロジェクト名に使用）</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">企業名（日本語）</label>
              <input
                type="text"
                value={form.companyNameJa}
                onChange={(e) => updateField('companyNameJa', e.target.value)}
                placeholder="ACMEコーポレーション"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">企業名（英語）</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="ACME Corporation"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">プラン</label>
                <select
                  value={form.plan}
                  onChange={(e) => updateField('plan', e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="TRIAL">TRIAL (30日間)</option>
                  <option value="BIZ">BIZ</option>
                  <option value="ENT">ENT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">リージョン</label>
                <select
                  value={form.region}
                  onChange={(e) => updateField('region', e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="ap-northeast-1">東京 (ap-northeast-1)</option>
                  <option value="ap-southeast-1">シンガポール (ap-southeast-1)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)}>次へ</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 2: Contact */}
      {step === 2 && (
        <Card>
          <CardHeader title="担当者情報" subtitle="顧客側の主要連絡先を入力してください" />
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">担当者名</label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => updateField('contactName', e.target.value)}
                placeholder="田中太郎"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">メールアドレス</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => updateField('contactEmail', e.target.value)}
                placeholder="it-admin@example.co.jp"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.distributeInitialTemplates}
                  onChange={(e) => updateField('distributeInitialTemplates', e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-sm text-[#0F172A]">初期テンプレートを配布する</span>
              </label>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="secondary" onClick={() => setStep(1)}>戻る</Button>
              <Button onClick={() => setStep(3)}>次へ</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader title="確認" subtitle="以下の内容でテナントを作成します" />
          <CardBody className="space-y-4">
            <div className="bg-[#F8FAFC] rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">テナントコード</span>
                <span className="text-[#0F172A] font-medium">{form.code || '(未設定)'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">企業名</span>
                <span className="text-[#0F172A] font-medium">{form.companyNameJa || '(未設定)'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">プラン</span>
                <span className="text-[#0F172A] font-medium">{form.plan}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">リージョン</span>
                <span className="text-[#0F172A] font-medium">{form.region}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">担当者</span>
                <span className="text-[#0F172A] font-medium">{form.contactName} ({form.contactEmail})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">初期テンプレート</span>
                <span className="text-[#0F172A] font-medium">{form.distributeInitialTemplates ? '配布する' : '配布しない'}</span>
              </div>
            </div>

            <div className="bg-[#E0F2FE] rounded-lg p-4 text-sm text-[#0EA5E9]">
              <p className="font-medium">プロビジョニング時に以下が自動実行されます:</p>
              <ol className="mt-2 space-y-1 list-decimal list-inside text-[#475569]">
                <li>Supabase プロジェクト作成</li>
                <li>マイグレーション実行 (dc_ テーブル作成)</li>
                <li>Storage バケット作成</li>
                <li>テナントレジストリに登録</li>
                {form.distributeInitialTemplates && <li>初期テンプレートの配布</li>}
              </ol>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="secondary" onClick={() => setStep(2)}>戻る</Button>
              <Button onClick={handleSubmit}>テナントを作成</Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
