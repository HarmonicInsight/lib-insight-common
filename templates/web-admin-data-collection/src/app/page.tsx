'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  activeTenants: number;
  totalTemplates: number;
  avgAcceptanceRate: number;
  totalAiCalls: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeTenants: 0,
    totalTemplates: 0,
    avgAcceptanceRate: 0,
    totalAiCalls: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API once auth is implemented
    setStats({
      activeTenants: 12,
      totalTemplates: 45,
      avgAcceptanceRate: 78,
      totalAiCalls: 1234,
    });
    setLoading(false);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
      <p className="mt-1 text-sm text-slate-500">全テナントの概況</p>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="稼働中テナント"
          value={loading ? '...' : `${stats.activeTenants} 社`}
          color="blue"
        />
        <StatCard
          label="テンプレート総数"
          value={loading ? '...' : `${stats.totalTemplates}`}
          color="green"
        />
        <StatCard
          label="平均回収率"
          value={loading ? '...' : `${stats.avgAcceptanceRate}%`}
          color="amber"
        />
        <StatCard
          label="AI 利用量（今月）"
          value={loading ? '...' : `${stats.totalAiCalls.toLocaleString()} 回`}
          color="purple"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const colorMap = {
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50',
    amber: 'border-amber-500 bg-amber-50',
    purple: 'border-purple-500 bg-purple-50',
  };

  return (
    <div className={`rounded-lg border-l-4 bg-white p-5 shadow-sm ${colorMap[color]}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
