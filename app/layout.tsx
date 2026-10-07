import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/shell/app-shell';

export const metadata: Metadata = {
  title: 'RSD Solutions | CRM B2B & Prospección Inteligente',
  description: 'Sistema integral de gestión comercial, prospección de leads, diagnósticos y producción técnica para RSD Solutions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
