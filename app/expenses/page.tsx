'use client';

import React, { useState } from 'react';
import { useFinanceStore, Expense, PaymentMode } from '@/lib/store';
import { Plus, Search, Trash2, Filter, Download, PieChart, Calendar, Tag, CreditCard, User } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ExpensesPage() {
  const { expenses, categories, members, addExpense, deleteExpense } = useFinanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    subcategory: '',
    amount: 0,
    paymentMode: 'UPI',
    memberId: '',
    isSubscription: false,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.amount) return;

    addExpense({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
    } as Expense);
    
    setIsModalOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      subcategory: '',
      amount: 0,
      paymentMode: 'UPI',
      memberId: '',
      isSubscription: false,
      notes: '',
    });
  };

  const filteredExpenses = expenses.filter(e => {
    const category = categories.find(c => c.id === e.categoryId)?.name || '';
    const memberName = members.find(m => m.id === e.memberId)?.name || '';
    const matchesSearch = category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (e.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || e.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalMonthly = expenses
    .filter(e => isWithinInterval(parseISO(e.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }))
    .reduce((acc, e) => acc + e.amount, 0);

  const subscriptionTotal = expenses
    .filter(e => e.isSubscription)
    .reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-zinc-500 text-sm">Track and categorize your family spending.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Add Expense
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Calendar size={18} />
            </div>
            <span className="text-zinc-500 text-sm font-medium">This Month</span>
          </div>
          <h3 className="text-2xl font-bold text-white">₹{totalMonthly.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <CreditCard size={18} />
            </div>
            <span className="text-zinc-500 text-sm font-medium">Subscriptions</span>
          </div>
          <h3 className="text-2xl font-bold text-white">₹{subscriptionTotal.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
              <PieChart size={18} />
            </div>
            <span className="text-zinc-500 text-sm font-medium">Categories</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{categories.length} Active</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-[#141414] p-4 rounded-2xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-bottom border-white/5 bg-white/5">
              <th className="px-6 py-4 font-medium text-zinc-400">Date</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Category</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Amount</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Member</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Mode</th>
              <th className="px-6 py-4 font-medium text-zinc-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No expense records found.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-zinc-400">{format(parseISO(expense.date), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">
                        {categories.find(c => c.id === expense.categoryId)?.name || 'Other'}
                      </span>
                      {expense.subcategory && <span className="text-zinc-500 text-[10px]">{expense.subcategory}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-rose-400 font-semibold">₹{expense.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-zinc-400">
                    {members.find(m => m.id === expense.memberId)?.name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-white/5 text-zinc-400 text-[10px] uppercase tracking-wider font-bold">
                      {expense.paymentMode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteExpense(expense.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Amount</label>
                  <input 
                    type="number" 
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Category</label>
                  <select 
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value, subcategory: ''})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Subcategory</label>
                  <select 
                    value={formData.subcategory}
                    onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">None</option>
                    {categories.find(c => c.id === formData.categoryId)?.subcategories.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Member</label>
                  <select 
                    value={formData.memberId}
                    onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Select Member</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Payment Mode</label>
                  <select 
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({...formData, paymentMode: e.target.value as PaymentMode})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" 
                  id="isSubscription"
                  checked={formData.isSubscription}
                  onChange={(e) => setFormData({...formData, isSubscription: e.target.checked})}
                  className="w-4 h-4 rounded border-white/10 bg-[#1a1a1a] text-emerald-500 focus:ring-emerald-500/50"
                />
                <label htmlFor="isSubscription" className="text-sm text-zinc-400">This is a recurring subscription</label>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
