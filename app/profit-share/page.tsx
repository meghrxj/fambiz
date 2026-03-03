'use client';

import React, { useState } from 'react';
import { useFinanceStore, ProfitShare, PaymentMode } from '@/lib/store';
import { Plus, Trash2, PieChart, Calendar, User, Building2, Wallet, Users, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ProfitSharePage() {
  const { profitShares, members, properties, addProfitShare, deleteProfitShare } = useFinanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<ProfitShare>>({
    source: 'Rental Income',
    propertyId: '',
    totalAmount: 0,
    distributionDate: new Date().toISOString().split('T')[0],
    splits: [],
  });

  const [tempSplit, setTempSplit] = useState({
    memberId: '',
    amount: 0,
    paymentMode: 'Bank Transfer' as PaymentMode,
    notes: '',
  });

  const addSplit = () => {
    if (!tempSplit.memberId || !tempSplit.amount) return;
    setFormData({
      ...formData,
      splits: [...(formData.splits || []), { ...tempSplit }]
    });
    setTempSplit({
      memberId: '',
      amount: 0,
      paymentMode: 'Bank Transfer',
      notes: '',
    });
  };

  const removeSplit = (idx: number) => {
    setFormData({
      ...formData,
      splits: formData.splits?.filter((_, i) => i !== idx)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.totalAmount || (formData.splits?.length || 0) === 0) return;

    addProfitShare({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
    } as ProfitShare);
    
    setIsModalOpen(false);
    setFormData({
      source: 'Rental Income',
      propertyId: '',
      totalAmount: 0,
      distributionDate: new Date().toISOString().split('T')[0],
      splits: [],
    });
  };

  const totalDistributed = profitShares.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Profit Sharing</h1>
          <p className="text-zinc-500 text-sm">Distribute rental or other profits among family members.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Record Distribution
        </button>
      </header>

      <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Total Profits Distributed</p>
          <h3 className="text-3xl font-bold text-white">₹{totalDistributed.toLocaleString('en-IN')}</h3>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Total Distributions</p>
            <p className="text-xl font-bold text-white">{profitShares.length}</p>
          </div>
          <div className="text-right border-l border-white/5 pl-8">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Shareholders</p>
            <p className="text-xl font-bold text-emerald-500">{members.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {profitShares.map((share) => (
          <div key={share.id} className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden group">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500">
                  <PieChart size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{share.source}</h3>
                  <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">
                    {share.propertyId ? properties.find(p => p.id === share.propertyId)?.name : 'General Source'} • {format(parseISO(share.distributionDate), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Total Distributed</p>
                  <p className="text-xl font-bold text-emerald-400">₹{share.totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => deleteProfitShare(share.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {share.splits.map((split, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold">
                      {members.find(m => m.id === split.memberId)?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{members.find(m => m.id === split.memberId)?.name}</p>
                      <p className="text-[10px] text-zinc-500">{split.paymentMode}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white">₹{split.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-white mb-6">Record Profit Distribution</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Source Type</label>
                  <select 
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Rental Income">Rental Income</option>
                    <option value="Investment Profit">Investment Profit</option>
                    <option value="Business">Business</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Total Amount</label>
                  <input 
                    type="number" 
                    value={formData.totalAmount || ''}
                    onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Property (Optional)</label>
                  <select 
                    value={formData.propertyId}
                    onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">None</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Distribution Date</label>
                  <input 
                    type="date" 
                    value={formData.distributionDate}
                    onChange={(e) => setFormData({...formData, distributionDate: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>

              {/* Split Builder */}
              <div className="bg-white/5 p-6 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} /> Distribution Split
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select 
                    value={tempSplit.memberId}
                    onChange={(e) => setTempSplit({...tempSplit, memberId: e.target.value})}
                    className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="">Select Member</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    placeholder="Amount"
                    value={tempSplit.amount || ''}
                    onChange={(e) => setTempSplit({...tempSplit, amount: Number(e.target.value)})}
                    className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <select 
                    value={tempSplit.paymentMode}
                    onChange={(e) => setTempSplit({...tempSplit, paymentMode: e.target.value as PaymentMode})}
                    className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                  <button 
                    type="button"
                    onClick={addSplit}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg py-2 transition-colors"
                  >
                    Add Split
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {formData.splits?.map((split, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white font-medium">{members.find(m => m.id === split.memberId)?.name}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{split.paymentMode}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-emerald-400">₹{split.amount.toLocaleString('en-IN')}</span>
                        <button type="button" onClick={() => removeSplit(idx)} className="text-zinc-600 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.splits?.length === 0 && (
                    <p className="text-center text-zinc-600 text-xs py-4">No splits added yet.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors">Record Distribution</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
