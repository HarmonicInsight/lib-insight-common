import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'DC Admin Console — HARMONIC insight',
  description: 'データ収集プラットフォーム テナント管理コンソール',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <Sidebar />
        <div className="ml-60 min-h-screen bg-[#F8FAFC]">
          <Header />
          <main className="p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
