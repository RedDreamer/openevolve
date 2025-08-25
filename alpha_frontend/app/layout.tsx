import './globals.css';
import type { Metadata } from 'next';
import { StartedProvider } from '@/lib/state';
import TopNav from '@/components/TopNav';

export const metadata: Metadata = {
  title: 'AlphaEvolve Demo',
  description: 'Evolutionary coding demo (white theme)'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <StartedProvider>
          <TopNav />
          <div className="min-h-screen">{children}</div>
        </StartedProvider>
      </body>
    </html>
  );
}