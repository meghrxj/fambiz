'use client';

import React, { useState } from 'react';
import { useFinanceStore, Lending, LendingStatus } from '@/lib/store';
import { Plus, Trash2, HandCoins, Calendar, User, Search, Filter, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function LendingPage() {
  const { lending, addLending, deleteLending, updateLending } = useFinanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [selectedLendingId, setSelectedLendingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Lending>>({
    borrowerName: '',
    amount: 0,
    dateGiven: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    interestType: 'None',
    interestValue: 0,
    status: 'Active',
    notes: '',
  });

  const [repaymentData, setRepaymentData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.borrowerName || !formData.amount) return;

    addLending({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      repayments: [],
    } as Lending);
    
    setIsModalOpen(false);
    setFormData({
      borrowerName: '',
      amount: 0,
      dateGiven: new Date().toISOString().split('T')[0],
      expectedReturnDate: '',
      interestType: 'None',
      interestValue: 0,
      status: 'Active',
      notes: '',
    });
  };

  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLendingId || !repaymentData.amount) return;

    const loan = lending.find(l => l.id === selectedLendingId);
    if (!loan) return;

    const updatedRepayments = [...loan.repayments, { ...repaymentData }];
    const totalRepaid = updatedRepayments.reduce((sum, r) => sum + r.amount, 0);
    const newStatus = totalRepaid >= loan.amount ? 'Settled' : loan.status;

    updateLending({
      ...loan,
      repayments: updatedRepayments,
      status: newStatus as LendingStatus,
    });

    setIsRepaymentModalOpen(false);
    setRepaymentData({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      notes: '',
    });
  };

  const filteredLending = lending.filter(l => 
    l.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLent = lending
    .filter(l => l.status !== 'Settled')
    .reduce((acc, l) => {
      const repaid = l.repayments.reduce((sum, r) => sum + r.amount, 0);
      return acc + (l.amount - repaid);
    }, 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Lending Ledger</h1>
          <p className="text-zinc-500 text-sm">Track money lent to friends, family, or others.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          <Plus size={18} /> New Entry
        </button>
      </header>

      <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm font-medium mb-1">Total Outstanding Balance</p>
          <h3 className="text-3xl font-bold text-white">₹{totalLent.toLocaleString('en-IN')}</h3>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Active Loans</p>
            <p className="text-xl font-bold text-emerald-500">{lending.filter(l => l.status === 'Active').length}</p>
          </div>
          <div className="text-right border-l border-white/5 pl-4">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Settled</p>
            <p className="text-xl font-bold text-zinc-400">{lending.filter(l => l.status === 'Settled').length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-[#141414] p-4 rounded-2xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by borrower name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLending.map((loan) => {
          const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
          const balance = loan.amount - totalRepaid;
          
          return (
            <div key={loan.id} className="bg-[#141414] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    loan.status === 'Settled' ? "bg-zinc-500/10 text-zinc-500" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    <HandCoins size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{loan.borrowerName}</h3>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">
                      Given on {format(parseISO(loan.dateGiven), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {loan.status !== 'Settled' && (
                    <button 
                      onClick={() => {
                        setSelectedLendingId(loan.id);
                        setIsRepaymentModalOpen(true);
                      }}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      Add Repayment
                    </button>
                  )}
                  <button onClick={() => deleteLending(loan.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                  <p className="text-zinc-500 text-xs font-medium">Original Amount</p>
                  <p className="text-xl font-bold text-white">₹{loan.amount.toLocaleString('en-IN')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 text-xs font-medium">Outstanding Balance</p>
                  <p className={cn(
                    "text-xl font-bold",
                    balance > 0 ? "text-rose-400" : "text-emerald-400"
                  )}>
                    ₹{balance.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (totalRepaid / loan.amount) * 100)}%` }}
                />
              </div>

              <div className="space-y-3 border-t border-white/5 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Interest Rule</span>
                  <span className="text-zinc-300">{loan.interestType === 'None' ? 'No Interest' : `${loan.interestValue}${loan.interestType === 'Percentage' ? '%' : ' Fixed'}`}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Expected Return</span>
                  <span className="text-zinc-300">{loan.expectedReturnDate ? format(parseISO(loan.expectedReturnDate), 'dd MMM yyyy') : 'Not set'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Status</span>
                  <span className={cn(
                    "font-bold uppercase tracking-wider",
                    loan.status === 'Settled' ? "text-zinc-500" : "text-emerald-500"
                  )}>{loan.status}</span>
                </div>
              </div>

              {loan.repayments.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <History size={12} /> Repayment History
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-2">
                    {loan.repayments.map((r, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] bg-white/[0.02] p-2 rounded-lg">
                        <span className="text-zinc-400">{format(parseISO(r.date), 'dd MMM yy')}</span>
                        <span className="text-emerald-500 font-medium">₹{r.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">New Lending Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Borrower Name</label>
                <input 
                  type="text" 
                  value={formData.borrowerName}
                  onChange={(e) => setFormData({...formData, borrowerName: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Amount Given</label>
                  <input 
                    type="number" 
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Date Given</label>
                  <input 
                    type="date" 
                    value={formData.dateGiven}
                    onChange={(e) => setFormData({...formData, dateGiven: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Interest Type</label>
                  <select 
                    value={formData.interestType}
                    onChange={(e) => setFormData({...formData, interestType: e.target.value as any})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="None">None</option>
                    <option value="Fixed">Fixed Amount</option>
                    <option value="Percentage">Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Interest Value</label>
                  <input 
                    type="number" 
                    disabled={formData.interestType === 'None'}
                    value={formData.interestValue}
                    onChange={(e) => setFormData({...formData, interestValue: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Expected Return Date</label>
                <input 
                  type="date" 
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData({...formData, expectedReturnDate: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment Modal */}
      {isRepaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-sm p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Add Repayment</h2>
            <form onSubmit={handleRepaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Amount Received</label>
                <input 
                  type="number" 
                  value={repaymentData.amount || ''}
                  onChange={(e) => setRepaymentData({...repaymentData, amount: Number(e.target.value)})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Date Received</label>
                <input 
                  type="date" 
                  value={repaymentData.date}
                  onChange={(e) => setRepaymentData({...repaymentData, date: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Notes</label>
                <textarea 
                  value={repaymentData.notes}
                  onChange={(e) => setRepaymentData({...repaymentData, notes: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsRepaymentModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
