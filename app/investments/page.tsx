'use client';

import React, { useState } from 'react';
import { useFinanceStore, Investment, InvestmentType } from '@/lib/store';
import { Plus, Trash2, TrendingUp, Building2, Coins, Landmark, PieChart, User, Filter, Search, Edit3, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function InvestmentsPage() {
  const { investments, members, addInvestment, deleteInvestment, updateInvestment } = useFinanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const [formData, setFormData] = useState<Partial<Investment>>({
    memberId: '',
    type: 'Mutual Fund',
    name: '',
    folio: '',
    strategy: 'SIP',
    amount: 0,
    currentValue: 0,
    quantity: 0,
    dateInvested: new Date().toISOString().split('T')[0],
    platform: '',
    notes: '',
  });

  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.name || !formData.amount) return;

    addInvestment({
      ...formData,
      id: crypto.randomUUID().split('-')[0],
      currentValue: formData.currentValue || formData.amount,
    } as Investment);
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestment) return;

    updateInvestment(editingInvestment);
    setIsEditModalOpen(false);
    setEditingInvestment(null);
  };

  const resetForm = () => {
    setFormData({
      memberId: '',
      type: 'Mutual Fund',
      name: '',
      folio: '',
      strategy: 'SIP',
      amount: 0,
      currentValue: 0,
      quantity: 0,
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
  const totalCurrentValue = investments.reduce((acc, i) => acc + (i.currentValue || i.amount), 0);
  const totalGain = totalCurrentValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  
  const typeStats = investments.reduce((acc: any, i) => {
    acc[i.type] = (acc[i.type] || 0) + (i.currentValue || i.amount);
    return acc;
  }, {});

  const getIcon = (type: InvestmentType) => {
    switch (type) {
      case 'Mutual Fund': return <TrendingUp size={20} />;
      case 'Gold': return <Coins size={20} />;
      case 'Fixed Deposit': return <Landmark size={20} />;
      case 'Stock': return <Building2 size={20} />;
      case 'Bond': return <Briefcase size={20} />;
      default: return <PieChart size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Investments</h1>
          <p className="text-zinc-500 text-sm">Track Mutual Funds, Stocks, Gold, FDs, and Bonds across family members.</p>
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
          <div className="flex justify-between items-start">
            <div>
              <p className="text-zinc-500 text-sm font-medium mb-1">Total Portfolio Value</p>
              <h3 className="text-3xl font-bold text-white">₹{totalCurrentValue.toLocaleString('en-IN')}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "flex items-center text-xs font-bold px-2 py-0.5 rounded-full",
                  totalGain >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {totalGain >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                  ₹{Math.abs(totalGain).toLocaleString('en-IN')} ({totalGainPercent.toFixed(2)}%)
                </span>
                <span className="text-zinc-500 text-xs">Total Gain/Loss</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs font-medium mb-1">Invested Amount</p>
              <p className="text-lg font-semibold text-zinc-300">₹{totalInvested.toLocaleString('en-IN')}</p>
            </div>
          </div>
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
          <option value="Stock">Stock</option>
          <option value="Gold">Gold</option>
          <option value="Fixed Deposit">Fixed Deposit</option>
          <option value="Bond">Bond</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-bottom border-white/5 bg-white/5">
              <th className="px-6 py-4 font-medium text-zinc-400">Asset Details</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Member</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Invested</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Current Value</th>
              <th className="px-6 py-4 font-medium text-zinc-400">Gain/Loss</th>
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
              filteredInvestments.map((investment) => {
                const gain = (investment.currentValue || investment.amount) - investment.amount;
                const gainPercent = (gain / investment.amount) * 100;
                
                return (
                  <tr key={investment.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 text-emerald-500">
                          {getIcon(investment.type)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{investment.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">{investment.type}</span>
                            {investment.quantity && <span className="text-zinc-600 text-[10px]">Qty: {investment.quantity}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {members.find(m => m.id === investment.memberId)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-300 font-medium">₹{investment.amount.toLocaleString('en-IN')}</span>
                        <span className="text-zinc-600 text-[10px]">{format(parseISO(investment.dateInvested), 'dd MMM yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-semibold">₹{(investment.currentValue || investment.amount).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "flex items-center text-xs font-bold",
                        gain >= 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {gain >= 0 ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                        {gainPercent.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingInvestment(investment);
                            setIsEditModalOpen(true);
                          }}
                          className="text-zinc-500 hover:text-emerald-400 transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteInvestment(investment.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
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
                    <option value="Stock">Stock</option>
                    <option value="Gold">Gold</option>
                    <option value="Fixed Deposit">Fixed Deposit</option>
                    <option value="Bond">Bond</option>
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
                  placeholder={formData.type === 'Stock' ? 'e.g. Reliance Industries' : 'e.g. HDFC Top 100 Fund'}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Invested Amount</label>
                  <input 
                    type="number" 
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Current Value</label>
                  <input 
                    type="number" 
                    placeholder="Optional"
                    value={formData.currentValue || ''}
                    onChange={(e) => setFormData({...formData, currentValue: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Quantity / Units</label>
                  <input 
                    type="number" 
                    step="0.001"
                    placeholder="Optional"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
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

      {/* Edit Modal */}
      {isEditModalOpen && editingInvestment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-white mb-6">Update Current Value</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl mb-4">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Asset</p>
                <p className="text-white font-semibold">{editingInvestment.name}</p>
                <p className="text-zinc-400 text-xs mt-1">Invested: ₹{editingInvestment.amount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Current Market Value</label>
                <input 
                  type="number" 
                  value={editingInvestment.currentValue || ''}
                  onChange={(e) => setEditingInvestment({...editingInvestment, currentValue: Number(e.target.value)})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Quantity / Units (Optional)</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={editingInvestment.quantity || ''}
                  onChange={(e) => setEditingInvestment({...editingInvestment, quantity: Number(e.target.value)})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors">Update Value</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
