import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DC Admin Console — HARMONIC insight',
  description: 'Data Collection Platform — Tenant Management Console',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 bg-slate-800 text-white">
            <div className="p-6">
              <h1 className="text-lg font-bold text-white">DC Admin</h1>
              <p className="mt-1 text-xs text-slate-400">HARMONIC insight</p>
            </div>
            <nav className="mt-4 space-y-1 px-3">
              <NavLink href="/" label="ダッシュボード" />
              <NavLink href="/tenants" label="テナント管理" />
              <NavGroup label="テンプレート">
                <NavLink href="/templates" label="テンプレート一覧" />
                <NavLink href="/templates/designer" label="新規デザイン" />
                <NavLink href="/templates/distribute" label="配布" />
              </NavGroup>
              <NavLink href="/collection" label="回収状況" />
              <NavLink href="/ai-usage" label="AI 利用量" />
              <NavLink href="/migration" label="マイグレーション" />
              <NavLink href="/health" label="ヘルスチェック" />
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
    >
      {label}
    </a>
  );
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="ml-2 space-y-1 border-l border-slate-600 pl-2">{children}</div>
    </div>
  );
}
