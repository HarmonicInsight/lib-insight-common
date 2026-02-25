'use client';

import { useEffect, useState } from 'react';

interface TemplateRow {
  id: string;
  nameJa: string;
  name: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  fieldCount: number;
  schedule: string;
  updatedAt: string;
}

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API
    setTemplates([
      {
        id: '1',
        nameJa: '月次売上報告',
        name: 'Monthly Sales Report',
        category: '経理',
        status: 'published',
        version: 3,
        fieldCount: 12,
        schedule: 'monthly',
        updatedAt: '2026-02-20T10:00:00Z',
      },
      {
        id: '2',
        nameJa: '四半期人事レポート',
        name: 'Quarterly HR Report',
        category: '人事',
        status: 'draft',
        version: 1,
        fieldCount: 8,
        schedule: 'quarterly',
        updatedAt: '2026-02-18T14:00:00Z',
      },
    ]);
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">テンプレート管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            テンプレートのデザイン・マッピング・配布
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/templates/designer"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新規テンプレート作成
          </a>
          <a
            href="/templates/distribute"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            配布
          </a>
        </div>
      </div>

      {/* Template table */}
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                テンプレート名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                カテゴリ
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                ステータス
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Ver
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                フィールド数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                スケジュール
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                更新日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-slate-400">
                  読み込み中...
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{t.nameJa}</div>
                    <div className="text-xs text-slate-400">{t.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{t.category}</td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">v{t.version}</td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">{t.fieldCount}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <ScheduleLabel schedule={t.schedule} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(t.updatedAt).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-xs text-blue-600 hover:text-blue-800">編集</button>
                      {t.status === 'draft' && (
                        <button className="text-xs text-green-600 hover:text-green-800">公開</button>
                      )}
                      {t.status === 'published' && (
                        <button className="text-xs text-slate-500 hover:text-slate-700">アーカイブ</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Workflow explanation */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="text-sm font-semibold text-blue-800">テンプレート作成フロー（Stravis / Oracle Smart View 型）</h3>
        <div className="mt-3 flex items-center gap-3 text-xs text-blue-700">
          <span className="rounded-full bg-blue-200 px-3 py-1 font-medium">1. Excel アップロード</span>
          <span>→</span>
          <span className="rounded-full bg-blue-200 px-3 py-1 font-medium">2. Named Range マッピング</span>
          <span>→</span>
          <span className="rounded-full bg-blue-200 px-3 py-1 font-medium">3. バリデーション設定</span>
          <span>→</span>
          <span className="rounded-full bg-blue-200 px-3 py-1 font-medium">4. 保存 (draft)</span>
          <span>→</span>
          <span className="rounded-full bg-blue-200 px-3 py-1 font-medium">5. テナントに配布</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-slate-100 text-slate-600',
  };
  const labels: Record<string, string> = {
    draft: '下書き',
    published: '公開中',
    archived: 'アーカイブ',
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  );
}

function ScheduleLabel({ schedule }: { schedule: string }) {
  const labels: Record<string, string> = {
    once: '一回限り',
    monthly: '月次',
    quarterly: '四半期',
    yearly: '年次',
    custom: 'カスタム',
  };
  return <>{labels[schedule] ?? schedule}</>;
}
