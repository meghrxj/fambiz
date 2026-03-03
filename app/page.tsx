'use client';

import React from 'react';
import { useFinanceStore } from '@/lib/store';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  HandCoins, 
  Building2,
  Plus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Link from 'next/link';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const { 
    salaries, 
    rentalPayments, 
    expenses, 
    liabilities, 
    investments, 
    lending,
    members
  } = useFinanceStore();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Calculations
  const monthlySalary = salaries
    .filter(s => isWithinInterval(parseISO(s.dateReceived), { start: monthStart, end: monthEnd }))
    .reduce((acc, s) => acc + s.amount, 0);

  const monthlyRent = rentalPayments
    .filter(p => p.status === 'Paid' && isWithinInterval(parseISO(p.paidDate), { start: monthStart, end: monthEnd }))
    .reduce((acc, p) => acc + p.amountPaid, 0);

  const totalIncome = monthlySalary + monthlyRent;

  const monthlyExpenses = expenses
    .filter(e => isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd }))
    .reduce((acc, e) => acc + e.amount, 0);

  const netCashflow = totalIncome - monthlyExpenses;

  const activeLiabilities = liabilities.filter(l => l.status === 'Active');
  const monthlyEMI = activeLiabilities.reduce((acc, l) => acc + l.emiAmount, 0);

  const totalInvested = investments.reduce((acc, i) => acc + i.amount, 0);
  
  const outstandingLending = lending
    .filter(l => l.status !== 'Settled')
    .reduce((acc, l) => {
      const repaid = l.repayments.reduce((sum, r) => sum + r.amount, 0);
      return acc + (l.amount - repaid);
    }, 0);

  const kpis = [
    { name: 'Monthly Income', value: totalIncome, icon: Wallet, color: 'text-emerald-500', trend: '+12%' },
    { name: 'Monthly Expenses', value: monthlyExpenses, icon: TrendingDown, color: 'text-rose-500', trend: '-5%' },
    { name: 'Net Cashflow', value: netCashflow, icon: TrendingUp, color: 'text-blue-500' },
    { name: 'Monthly EMI', value: monthlyEMI, icon: CreditCard, color: 'text-amber-500', sub: `${activeLiabilities.length} Active` },
    { name: 'Total Investments', value: totalInvested, icon: Building2, color: 'text-violet-500' },
    { name: 'Outstanding Loans', value: outstandingLending, icon: HandCoins, color: 'text-indigo-500' },
  ];

  // Chart Data
  const expenseByCategory = expenses.reduce((acc: any[], e) => {
    const category = useFinanceStore.getState().categories.find(c => c.id === e.categoryId)?.name || 'Other';
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.value += e.amount;
    } else {
      acc.push({ name: category, value: e.amount });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Welcome back. Here&apos;s your family&apos;s financial overview.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/expenses" className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <Plus size={16} /> Add Expense
          </Link>
          <Link href="/income/salary" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <Plus size={16} /> Add Income
          </Link>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="bg-[#141414] border border-white/5 p-6 rounded-2xl shadow-sm hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors`}>
                <kpi.icon className={kpi.color} size={24} />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${kpi.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {kpi.trend}
                </span>
              )}
            </div>
            <div>
              <p className="text-zinc-500 text-sm font-medium">{kpi.name}</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ₹{kpi.value.toLocaleString('en-IN')}
              </h3>
              {kpi.sub && <p className="text-zinc-600 text-xs mt-1">{kpi.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-6">Expenses by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {expenseByCategory.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-zinc-400">{item.name}</span>
                <span className="text-xs text-zinc-500 ml-auto">₹{item.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-6">Income vs Expenses</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Current Month', income: totalIncome, expenses: monthlyExpenses }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={12} />
                <YAxis stroke="#555" fontSize={12} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
