'use client';

import React, { useState } from 'react';
import { useFinanceStore } from '@/lib/store';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, eachMonthOfInterval } from 'date-fns';
import { Download, Filter, Calendar, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function ReportsPage() {
  const { salaries, rentalPayments, expenses, liabilities, investments, categories } = useFinanceStore();
  const [timeRange, setTimeRange] = useState('6m'); // 3m, 6m, 1y

  const now = new Date();
  const rangeStart = timeRange === '3m' ? subMonths(now, 2) : timeRange === '6m' ? subMonths(now, 5) : subMonths(now, 11);
  
  const months = eachMonthOfInterval({
    start: startOfMonth(rangeStart),
    end: endOfMonth(now)
  });

  const chartData = months.map(month => {
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    const monthLabel = format(month, 'MMM yy');

    const salary = salaries
      .filter(s => isWithinInterval(parseISO(s.dateReceived), { start: mStart, end: mEnd }))
      .reduce((acc, s) => acc + s.amount, 0);

    const rent = rentalPayments
      .filter(p => p.status === 'Paid' && isWithinInterval(parseISO(p.paidDate), { start: mStart, end: mEnd }))
      .reduce((acc, p) => acc + p.amountPaid, 0);

    const expense = expenses
      .filter(e => isWithinInterval(parseISO(e.date), { start: mStart, end: mEnd }))
      .reduce((acc, e) => acc + e.amount, 0);

    const investment = investments
      .filter(i => isWithinInterval(parseISO(i.dateInvested), { start: mStart, end: mEnd }))
      .reduce((acc, i) => acc + i.amount, 0);

    return {
      name: monthLabel,
      income: salary + rent,
      expenses: expense,
      investments: investment,
      savings: (salary + rent) - expense
    };
  });

  const expenseByCategory = categories.map(cat => {
    const total = expenses
      .filter(e => e.categoryId === cat.id)
      .reduce((acc, e) => acc + e.amount, 0);
    return { name: cat.name, value: total };
  }).filter(c => c.value > 0);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-zinc-500 text-sm">Deep dive into your family&apos;s financial performance.</p>
        </div>
        <div className="flex gap-2 bg-[#141414] p-1 rounded-xl border border-white/5">
          {['3m', '6m', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                timeRange === range ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      {/* Main Trend Chart */}
      <div className="bg-[#141414] border border-white/5 p-8 rounded-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-semibold text-white">Cashflow Trend</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-500">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-xs text-zinc-500">Expenses</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-[#141414] border border-white/5 p-8 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-8">Expense Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-y-3 mt-6">
            {expenseByCategory.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-zinc-400">{item.name}</span>
                <span className="text-xs text-zinc-500 ml-auto">₹{item.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Savings & Investments */}
        <div className="bg-[#141414] border border-white/5 p-8 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-8">Savings vs Investments</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="savings" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="investments" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Wallet size={16} />
                </div>
                <span className="text-sm text-zinc-400">Avg. Monthly Savings</span>
              </div>
              <span className="text-sm font-bold text-white">
                ₹{(chartData.reduce((acc, d) => acc + d.savings, 0) / chartData.length).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                  <TrendingUp size={16} />
                </div>
                <span className="text-sm text-zinc-400">Avg. Monthly Investment</span>
              </div>
              <span className="text-sm font-bold text-white">
                ₹{(chartData.reduce((acc, d) => acc + d.investments, 0) / chartData.length).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
