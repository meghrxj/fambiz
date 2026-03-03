'use client';

import React, { useState } from 'react';
import { useFinanceStore, Investment, InvestmentType } from '@/lib/store';
import { Plus, Trash2, TrendingUp, Building2, Coins, Landmark, PieChart, User, Filter, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function InvestmentsPage() {
  const { investments, members, addInvestment, deleteInvestment } = useFinanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const [formData, setFormData] = useState<Partial<Investment>>({
    memberId: '',
    type: 'Mutual Fund',
    name: '',
    folio: '',
    strategy: 'SIP',
    amount: 0,
    dateInvested: new Date().toISOString().split('T')[0],
    platform: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.name || !formData.amount) return;

    addInvestment({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
    } as Investment);
    
    setIsModalOpen(false);
    setFormData({
      memberId: '',
      type: 'Mutual Fund',
      name: '',
      folio: '',
      strategy: 'SIP',
      amount: 0,
      dateInvested: new Date().toISOString().split('T')[0],
      platform: '',
      notes: '',
    });
  };

  const filteredInvestments = investments.filter(i => {
    const memberName = members.find(m => m.id === i.memberId)?.name || '';
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || i.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalInvested = investments.reduce((acc, i) => acc + i.amount, 0);
  
  const typeStats = investments.reduce((acc: any, i) => {
    acc[i.type] = (acc[i.type] || 0) + i.amount;
    return acc;
  }, {});

  const getIcon = (type: InvestmentType) => {
    switch (type) {
      case 'Mutual Fund': return <TrendingUp size={20} />;
      case 'Gold': return <Coins size={20} />;
      case 'Fixed Deposit': return <Landmark size={20} />;
      case 'Stock': return <Building2 size={20} />;
      default: return <PieChart size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Investments</h1>
          <p className="text-zinc-500 text-sm">Track Mutual Funds, Gold, FDs, and Stocks across family members.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Add Investment
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl col-span-1 md:col-span-2">
          <p className="text-zinc-500 text-sm font-medium mb-1">Total Portfolio Contribution</p>
          <h3 className="text-3xl font-bold text-white">₹{totalInvested.toLocaleString('en-IN')}</h3>
        </div>
        {Object.entries(typeStats).map(([type, amount]: [any, any]) => (
          <div key={type} className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-emerald-500">{getIcon(type)}</div>
              <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{type}</span>
            </div>
            <h3 className="text-xl font-bold text-white">₹{amount.toLocaleString('en-IN')}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-[#141414] p-4 rounded-2xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search investments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="Mutual Fund">Mutual Fund</option>
          <option value="Gold">Gold</option>
          <option value="Fixed Deposit">Fixed Deposit</option>
          <option value="Stock">Stock</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-bottom border-white/5 bg-white/5">
              <th className="px-6 py-4 font-medium text-zinc-400">Investment Name</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Member</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Type</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Amount</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Date</th>
              <th className="px-6 py-4 font-medium text-zinc-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredInvestments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No investment records found.
                </td>
              </tr>
            ) : (
              filteredInvestments.map((investment) => (
                <tr key={investment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{investment.name}</span>
                      {investment.folio && <span className="text-zinc-500 text-[10px]">Folio: {investment.folio}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {members.find(m => m.id === investment.memberId)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      {getIcon(investment.type)}
                      <span className="text-xs">{investment.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-semibold">₹{investment.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-zinc-400">{format(parseISO(investment.dateInvested), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteInvestment(investment.id)}
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
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-white mb-6">Add Investment</h2>
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
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as InvestmentType})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Mutual Fund">Mutual Fund</option>
                    <option value="Gold">Gold</option>
                    <option value="Fixed Deposit">Fixed Deposit</option>
                    <option value="Stock">Stock</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Strategy</label>
                  <select 
                    value={formData.strategy}
                    onChange={(e) => setFormData({...formData, strategy: e.target.value as any})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="SIP">SIP</option>
                    <option value="Lumpsum">Lumpsum</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Investment Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. HDFC Top 100 Fund"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
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
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Date</label>
                  <input 
                    type="date" 
                    value={formData.dateInvested}
                    onChange={(e) => setFormData({...formData, dateInvested: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Folio / A/C No</label>
                  <input 
                    type="text" 
                    value={formData.folio}
                    onChange={(e) => setFormData({...formData, folio: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Platform</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Groww, Zerodha"
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors">Save Investment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
