'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MOCK_COLLECTION_SUMMARY } from '@/lib/mock-data';

export default function CollectionPage() {
  const collections = MOCK_COLLECTION_SUMMARY;
  const overallRate = collections.length > 0
    ? Math.round(collections.reduce((sum, c) => sum + c.collectionRate, 0) / collections.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#475569]">全体回収率</p>
          <p className={`text-3xl font-bold mt-1 ${overallRate >= 80 ? 'text-[#16A34A]' : overallRate >= 50 ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>
            {overallRate}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#475569]">総送信数</p>
          <p className="text-3xl font-bold mt-1 text-[#0F172A]">
            {collections.reduce((sum, c) => sum + c.submittedCount, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#475569]">承認済み</p>
          <p className="text-3xl font-bold mt-1 text-[#16A34A]">
            {collections.reduce((sum, c) => sum + c.acceptedCount, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#475569]">レビュー待ち</p>
          <p className="text-3xl font-bold mt-1 text-[#D97706]">
            {collections.reduce((sum, c) => sum + c.pendingCount, 0)}
          </p>
        </div>
      </div>

      {/* Template Collection Details */}
      {collections.map((item) => {
        const deadline = item.deadline ? new Date(item.deadline) : null;
        const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
        const isUrgent = daysLeft !== null && daysLeft <= 7;

        return (
          <Card key={item.templateId}>
            <CardHeader
              title={item.templateNameJa}
              subtitle={item.templateName}
              action={
                deadline && (
                  <div className={`text-sm font-medium ${isUrgent ? 'text-[#DC2626]' : 'text-[#475569]'}`}>
                    締切: {deadline.toLocaleDateString('ja-JP')}
                    {daysLeft !== null && (
                      <span className="ml-2">
                        ({daysLeft > 0 ? `残り${daysLeft}日` : '期限切れ'})
                      </span>
                    )}
                  </div>
                )
              }
            />
            <CardBody>
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#475569]">
                    回収進捗: {item.submittedCount}/{item.totalExpected} 件
                  </span>
                  <span className={`text-lg font-bold ${item.collectionRate >= 80 ? 'text-[#16A34A]' : item.collectionRate >= 50 ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>
                    {item.collectionRate}%
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${item.collectionRate}%`,
                      backgroundColor: item.collectionRate >= 80 ? '#16A34A' : item.collectionRate >= 50 ? '#D97706' : '#DC2626',
                    }}
                  />
                </div>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-5 gap-4">
                <StatusBlock label="承認" count={item.acceptedCount} color="#16A34A" bgColor="#DCFCE7" />
                <StatusBlock label="送信済み" count={item.submittedCount - item.acceptedCount - item.rejectedCount - item.pendingCount} color="#2563EB" bgColor="#DBEAFE" />
                <StatusBlock label="レビュー待ち" count={item.pendingCount} color="#D97706" bgColor="#FEF3C7" />
                <StatusBlock label="却下" count={item.rejectedCount} color="#DC2626" bgColor="#FEE2E2" />
                <StatusBlock label="下書き" count={item.draftCount} color="#475569" bgColor="#F1F5F9" />
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function StatusBlock({ label, count, color, bgColor }: { label: string; count: number; color: string; bgColor: string }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: bgColor }}>
      <p className="text-2xl font-bold" style={{ color }}>{count}</p>
      <p className="text-xs mt-1" style={{ color }}>{label}</p>
    </div>
  );
}
