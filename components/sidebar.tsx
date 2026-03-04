'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useFinanceStore } from '@/lib/store';
import { 
  LayoutDashboard, 
  Wallet, 
  Home, 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  HandCoins, 
  PieChart, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  Database,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { 
    name: 'Income', 
    icon: Wallet, 
    children: [
      { name: 'Salary', href: '/income/salary' },
      { name: 'Rental Income', href: '/income/rental' },
    ]
  },
  { name: 'Expenses', icon: Receipt, href: '/expenses' },
  { name: 'Liabilities', icon: CreditCard, href: '/liabilities' },
  { name: 'Investments', icon: TrendingUp, href: '/investments' },
  { name: 'Lending', icon: HandCoins, href: '/lending' },
  { name: 'Profit Share', icon: PieChart, href: '/profit-share' },
  { name: 'Reports', icon: BarChart3, href: '/reports' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const serverStatus = useFinanceStore((state) => state.serverStatus);

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-[#0f0f0f] border-l border-white/5 flex flex-col z-50">
      <div className="p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          Finance OS
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || item.children?.some(child => pathname === child.href);
          
          return (
            <div key={item.name}>
              {item.children ? (
                <div className="space-y-1">
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "text-white bg-white/5" : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}>
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </div>
                  <div className="ml-9 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          pathname === child.href ? "text-emerald-400 bg-emerald-400/5" : "text-zinc-500 hover:text-white"
                        )}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href!}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href ? "text-white bg-white/5" : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                  {pathname === item.href && (
                    <ChevronRight size={14} className="ml-auto text-emerald-500" />
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 mt-auto space-y-2">
        <div className="px-3 py-2 rounded-lg bg-white/5 flex items-center gap-3">
          {serverStatus === 'connected' ? (
            <Database size={14} className="text-emerald-500" />
          ) : serverStatus === 'loading' ? (
            <RefreshCcw size={14} className="text-sky-500 animate-spin" />
          ) : (
            <AlertCircle size={14} className="text-rose-500" />
          )}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Website Storage</span>
            <span className={cn(
              "text-xs font-medium",
              serverStatus === 'connected' ? "text-emerald-400" : 
              serverStatus === 'loading' ? "text-sky-400" : "text-rose-400"
            )}>
              {serverStatus === 'connected' ? 'Connected' : 
               serverStatus === 'loading' ? 'Connecting...' : 'Connection Error'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
