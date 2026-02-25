'use client';

import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';

export function Header() {
  const pathname = usePathname();

  const currentNav = NAV_ITEMS.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
  );

  const title = currentNav?.label || 'DC Admin Console';
  const titleEn = currentNav?.labelEn || 'DC Admin Console';

  return (
    <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-[#0F172A]">{title}</h2>
        <span className="text-xs text-[#94A3B8] font-medium">{titleEn}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Environment indicator */}
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#FEF3C7] text-[#D97706]">
          DEV
        </span>

        {/* User avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#475569] text-xs font-medium">
          A
        </div>
      </div>
    </header>
  );
}
