import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { PasswordGate } from '@/components/password-gate';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'Family Finance OS',
  description: 'Premium Family Finance Dashboard',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-[#0a0a0a] text-zinc-100 antialiased selection:bg-emerald-500/30">
        <AuthProvider>
          <PasswordGate>
            <div className="flex min-h-screen">
              <main className="flex-1 mr-64 p-8 overflow-y-auto">
                {children}
              </main>
              <Sidebar />
            </div>
          </PasswordGate>
        </AuthProvider>
      </body>
    </html>
  );
}
