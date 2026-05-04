import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin']);

export const metadata: Metadata = {
  title: 'CuratorSpace 3D - 虚拟博物馆布展平台',
  description: '使用 Next.js + Fastify + SQLite + Three.js 开发的虚拟博物馆布展平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
