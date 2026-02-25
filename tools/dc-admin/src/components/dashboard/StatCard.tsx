interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: { value: number; label: string };
}

export function StatCard({ label, value, suffix, icon, color, bgColor, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#475569] font-medium">{label}</p>
          <p className="text-2xl font-bold text-[#0F172A] mt-1">
            {value}
            {suffix && <span className="text-sm font-normal text-[#475569] ml-1">{suffix}</span>}
          </p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.value >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: bgColor, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
