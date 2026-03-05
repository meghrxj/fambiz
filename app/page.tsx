'use client';

import React, { useState } from 'react';
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
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, addMonths } from 'date-fns';
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
import { cn } from '@/lib/utils';

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

  const monthlyInvestment = investments
    .filter(i => isWithinInterval(parseISO(i.dateInvested), { start: monthStart, end: monthEnd }))
    .reduce((acc, i) => acc + i.amount, 0);

  const totalIncome = monthlyRent;

  const monthlyExpenses = expenses
    .filter(e => isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd }))
    .reduce((acc, e) => acc + e.amount, 0);

  const netCashflow = totalIncome - monthlyExpenses - monthlyInvestment;

  const activeLiabilities = liabilities.filter(l => l.status === 'Active');
  const monthlyEMI = activeLiabilities.reduce((acc, l) => acc + l.emiAmount, 0);

  const totalInvested = investments.reduce((acc, i) => acc + i.amount, 0);
  const totalCurrentInvestments = investments.reduce((acc, i) => acc + (i.currentValue || i.amount), 0);
  
  const totalSalaryAllTime = salaries.reduce((acc, s) => acc + s.amount, 0);
  const totalRentAllTime = rentalPayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalEMIPaidAllTime = liabilities.reduce((acc, l) => {
    const paidEMIs = (l.emiPayments || []).filter(p => p.status === 'Paid').length;
    return acc + (paidEMIs * l.emiAmount);
  }, 0);

  const totalAssets = totalRentAllTime + totalCurrentInvestments - totalEMIPaidAllTime;

  const outstandingLending = lending
    .filter(l => l.status !== 'Settled')
    .reduce((acc, l) => {
      const repaid = l.repayments.reduce((sum, r) => sum + r.amount, 0);
      return acc + (l.amount - repaid);
    }, 0);

  const kpis = [
    { name: 'Total Assets', value: totalAssets, icon: Wallet, color: 'text-emerald-500', sub: 'Salary + Rent + Inv - EMI' },
    { name: 'Monthly Income', value: totalIncome, icon: TrendingUp, color: 'text-emerald-400' },
    { name: 'Monthly Investment', value: monthlyInvestment, icon: Building2, color: 'text-violet-500' },
    { name: 'Monthly EMI', value: monthlyEMI, icon: CreditCard, color: 'text-amber-500', sub: `${activeLiabilities.length} Active` },
    { name: 'Net Cashflow', value: netCashflow, icon: TrendingUp, color: 'text-blue-500' },
    { name: 'Outstanding Loans', value: outstandingLending, icon: HandCoins, color: 'text-indigo-500' },
  ];

  // Report Data (Last 10 years)
  const reportData = Array.from({ length: 120 }, (_, i) => {
    const d = addMonths(now, -i);
    const monthTag = format(d, 'yyyy-MM');
    
    const salary = salaries
      .filter(s => s.monthTag === monthTag)
      .reduce((acc, s) => acc + s.amount, 0);
      
    const rent = rentalPayments
      .filter(p => p.monthFor === monthTag)
      .reduce((acc, p) => acc + p.amountPaid, 0);
      
    const inv = investments
      .filter(inv => inv.dateInvested.startsWith(monthTag))
      .reduce((acc, inv) => acc + inv.amount, 0);
      
    return {
      name: format(d, 'MMM yy'),
      salary,
      rent,
      investment: inv,
      monthTag
    };
  }).reverse();

  const [reportRange, setReportRange] = useState<'5y' | '10y'>('5y');
  const filteredReportData = reportData.slice(reportRange === '5y' ? -60 : -120);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Welcome back. Here&apos;s your family&apos;s financial portfolio.</p>
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
      <div className="space-y-6">
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Portfolio Growth Report</h3>
            <div className="flex bg-white/5 p-1 rounded-lg">
              <button 
                onClick={() => setReportRange('5y')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", reportRange === '5y' ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-white")}
              >
                5 Years
              </button>
              <button 
                onClick={() => setReportRange('10y')}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", reportRange === '10y' ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-white")}
              >
                10 Years
              </button>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredReportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={10} tick={{ fill: '#555' }} interval={reportRange === '5y' ? 5 : 11} />
                <YAxis stroke="#555" fontSize={10} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#888', marginBottom: '4px' }}
                />
                <Bar dataKey="salary" name="Salary" fill="#10b981" stackId="a" />
                <Bar dataKey="rent" name="Rental" fill="#3b82f6" stackId="a" />
                <Bar dataKey="investment" name="Investment" fill="#8b5cf6" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
