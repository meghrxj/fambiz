'use client';

import React, { useState } from 'react';
import { useFinanceStore, SalaryIncome, PaymentMode } from '@/lib/store';
import { Plus, Search, Trash2, Filter, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SalaryPage() {
  const { salaries, members, addSalary, addSalaryRange, deleteSalary } = useFinanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<SalaryIncome>>({
    memberId: '',
    amount: 0,
    frequency: 'Monthly',
    dateReceived: new Date().toISOString().split('T')[0],
    monthTag: format(new Date(), 'yyyy-MM'),
    paymentMode: 'Bank Transfer',
    notes: '',
  });

  const [rangeData, setRangeData] = useState({
    memberId: '',
    amount: 0,
    startDate: format(new Date(), 'yyyy-MM'),
    endDate: format(new Date(), 'yyyy-MM'),
    employer: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.amount) return;

    addSalary({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      monthTag: formData.monthTag || format(new Date(formData.dateReceived!), 'yyyy-MM'),
    } as SalaryIncome);
    
    setIsModalOpen(false);
    setFormData({
      memberId: '',
      amount: 0,
      frequency: 'Monthly',
      dateReceived: new Date().toISOString().split('T')[0],
      monthTag: format(new Date(), 'yyyy-MM'),
      paymentMode: 'Bank Transfer',
      notes: '',
    });
  };

  const handleRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeData.memberId || !rangeData.amount || !rangeData.startDate || !rangeData.endDate) return;
    
    addSalaryRange(
      rangeData.memberId,
      rangeData.amount,
      rangeData.startDate + '-01',
      rangeData.endDate + '-01',
      rangeData.employer
    );
    
    setIsRangeModalOpen(false);
  };

  const filteredSalaries = salaries.sort((a, b) => b.monthTag.localeCompare(a.monthTag)).filter(s => {
    const memberName = members.find(m => m.id === s.memberId)?.name || '';
    return memberName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           s.monthTag.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Salary Income</h1>
          <p className="text-zinc-500 text-sm">Manage monthly salary entries for family members.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsRangeModalOpen(true)}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <Calendar size={18} /> Bulk Add Range
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Add Salary
          </button>
        </div>
      </header>

      <div className="flex gap-4 items-center bg-[#141414] p-4 rounded-2xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by member or month..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <button className="p-2 text-zinc-400 hover:text-white transition-colors">
          <Filter size={20} />
        </button>
        <button className="p-2 text-zinc-400 hover:text-white transition-colors">
          <Download size={20} />
        </button>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-bottom border-white/5 bg-white/5">
              <th className="px-6 py-4 font-medium text-zinc-400">Member</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Month</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Amount</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Date Received</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Mode</th>
              <th className="px-6 py-4 font-medium text-zinc-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredSalaries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No salary records found.
                </td>
              </tr>
            ) : (
              filteredSalaries.map((salary) => (
                <tr key={salary.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">
                    {members.find(m => m.id === salary.memberId)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{salary.monthTag}</td>
                  <td className="px-6 py-4 text-emerald-400 font-semibold">₹{salary.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-zinc-400">{format(new Date(salary.dateReceived), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-white/5 text-zinc-400 text-[10px] uppercase tracking-wider font-bold">
                      {salary.paymentMode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteSalary(salary.id)}
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

      {/* Range Modal */}
      {isRangeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Bulk Add Salary Range</h2>
            <form onSubmit={handleRangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Family Member</label>
                <select 
                  value={rangeData.memberId}
                  onChange={(e) => setRangeData({...rangeData, memberId: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                >
                  <option value="">Select Member</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Monthly Amount</label>
                <input 
                  type="number" 
                  value={rangeData.amount || ''}
                  onChange={(e) => setRangeData({...rangeData, amount: Number(e.target.value)})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Start Month</label>
                  <input 
                    type="month" 
                    value={rangeData.startDate}
                    onChange={(e) => setRangeData({...rangeData, startDate: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">End Month</label>
                  <input 
                    type="month" 
                    value={rangeData.endDate}
                    onChange={(e) => setRangeData({...rangeData, endDate: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Employer (Optional)</label>
                <input 
                  type="text" 
                  value={rangeData.employer}
                  onChange={(e) => setRangeData({...rangeData, employer: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsRangeModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors"
                >
                  Generate Entries
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Add Salary Income</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Family Member</label>
                <select 
                  value={formData.memberId}
                  onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                >
                  <option value="">Select Member</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Frequency</label>
                  <select 
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value as any})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="One-time">One-time</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Date Received</label>
                  <input 
                    type="date" 
                    value={formData.dateReceived}
                    onChange={(e) => setFormData({...formData, dateReceived: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Payment Mode</label>
                  <select 
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({...formData, paymentMode: e.target.value as PaymentMode})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
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
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
