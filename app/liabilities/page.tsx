'use client';

import React, { useState } from 'react';
import { useFinanceStore, Liability, PaymentMode, LiabilityStatus } from '@/lib/store';
import { Plus, Trash2, CreditCard, Calendar, AlertCircle, CheckCircle2, Building2, TrendingDown, ChevronRight } from 'lucide-react';
import { format, parseISO, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';

export default function LiabilitiesPage() {
  const { liabilities, addLiability, deleteLiability, updateLiability, toggleEMIPayment } = useFinanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLiabilityId, setSelectedLiabilityId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Liability> & { totalEMIMonths?: number }>({
    type: 'Loan',
    lender: '',
    principal: 0,
    emiAmount: 0,
    emiDueDateMonthly: 1,
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    paymentModeDefault: 'Bank Transfer',
    notes: '',
    totalEMIMonths: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lender || !formData.emiAmount) return;

    const totalMonths = formData.totalEMIMonths || 0;
    const emiPayments: { month: string; status: 'Paid' | 'Pending' }[] = [];
    if (totalMonths > 0 && formData.startDate) {
      const start = parseISO(formData.startDate);
      for (let i = 0; i < totalMonths; i++) {
        const m = addMonths(start, i);
        emiPayments.push({
          month: format(m, 'yyyy-MM'),
          status: 'Pending',
        });
      }
    }

    addLiability({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      emiPayments,
      totalEMIMonths: totalMonths,
    } as Liability);
    
    setIsModalOpen(false);
    setFormData({
      type: 'Loan',
      lender: '',
      principal: 0,
      emiAmount: 0,
      emiDueDateMonthly: 1,
      startDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      paymentModeDefault: 'Bank Transfer',
      notes: '',
      totalEMIMonths: 0,
    });
  };

  const activeLiabilities = liabilities.filter(l => l.status === 'Active');
  const totalEMI = activeLiabilities.reduce((acc, l) => acc + l.emiAmount, 0);
  const totalPaidSoFar = liabilities.reduce((acc, l) => {
    const paidEMIs = l.emiPayments?.filter(p => p.status === 'Paid').length || 0;
    return acc + (paidEMIs * l.emiAmount);
  }, 0);
  const totalLiabilityAmount = activeLiabilities.reduce((acc, l) => {
    const months = (l as any).totalEMIMonths || l.emiPayments?.length || 0;
    return acc + (l.emiAmount * months);
  }, 0);
  const totalPaidActive = activeLiabilities.reduce((acc, l) => {
    const paidEMIs = l.emiPayments?.filter(p => p.status === 'Paid').length || 0;
    return acc + (paidEMIs * l.emiAmount);
  }, 0);
  const remainingLiability = totalLiabilityAmount - totalPaidActive;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Liabilities & EMIs</h1>
          <p className="text-zinc-500 text-sm">Track your loans, EMIs, and monthly debt obligations.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Add Liability
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <TrendingDown size={18} />
            </div>
            <span className="text-zinc-500 text-sm font-medium">Monthly EMI Total</span>
          </div>
          <h3 className="text-2xl font-bold text-white">₹{totalEMI.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-zinc-500 text-sm font-medium">Total Paid So Far</span>
          </div>
          <h3 className="text-2xl font-bold text-white">₹{totalPaidSoFar.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertCircle size={18} />
            </div>
            <span className="text-zinc-500 text-sm font-medium">Remaining Liability</span>
          </div>
          <h3 className="text-2xl font-bold text-white">₹{remainingLiability.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500">
              <Calendar size={18} />
            </div>
            <span className="text-zinc-500 text-sm font-medium">Active Loans</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{activeLiabilities.length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {liabilities.map((liability) => {
          const paidCount = liability.emiPayments?.filter(p => p.status === 'Paid').length || 0;
          const totalEMIs = liability.emiPayments?.length || 0;
          const paidAmount = paidCount * liability.emiAmount;
          const totalLoanValue = liability.emiAmount * totalEMIs;
          const balanceAmount = totalLoanValue - paidAmount;

          return (
            <div key={liability.id} className="bg-[#141414] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    liability.status === 'Active' ? "bg-amber-500/10 text-amber-500" : "bg-zinc-500/10 text-zinc-500"
                  )}>
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{liability.lender}</h3>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">{liability.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateLiability({...liability, status: liability.status === 'Active' ? 'Closed' : 'Active'})}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors",
                      liability.status === 'Active' ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20"
                    )}
                  >
                    {liability.status === 'Active' ? 'Mark Closed' : 'Reopen'}
                  </button>
                  <button onClick={() => deleteLiability(liability.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                  <p className="text-zinc-500 text-xs font-medium">Monthly EMI</p>
                  <p className="text-xl font-bold text-white">₹{liability.emiAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 text-xs font-medium">Due Date</p>
                  <p className="text-xl font-bold text-white">Day {liability.emiDueDateMonthly}</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-white/5 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Principal Amount</span>
                  <span className="text-zinc-300">₹{liability.principal?.toLocaleString('en-IN') || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total Loan Value</span>
                  <span className="text-zinc-300">₹{totalLoanValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Paid So Far</span>
                  <span className="text-emerald-400 font-medium">₹{paidAmount.toLocaleString('en-IN')} ({paidCount}/{totalEMIs} EMIs)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Balance Amount</span>
                  <span className={cn("font-medium", balanceAmount > 0 ? "text-rose-400" : "text-emerald-400")}>
                    ₹{balanceAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                {totalEMIs > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((paidCount / totalEMIs) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(paidCount / totalEMIs) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Start Date</span>
                  <span className="text-zinc-300">{format(parseISO(liability.startDate), 'dd MMM yyyy')}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedLiabilityId(selectedLiabilityId === liability.id ? null : liability.id)}
                className="w-full mt-6 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                {selectedLiabilityId === liability.id ? 'Hide EMI Schedule' : 'View EMI Schedule'}
                <ChevronRight size={14} className={cn("transition-transform", selectedLiabilityId === liability.id && "rotate-90")} />
              </button>

              {selectedLiabilityId === liability.id && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {liability.emiPayments?.map((emi) => (
                    <div key={emi.month} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">{emi.month}</p>
                        <p className="text-[10px] text-zinc-500">Due on Day {liability.emiDueDateMonthly}</p>
                      </div>
                      <button
                        onClick={() => toggleEMIPayment(liability.id, emi.month)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          emi.status === 'Paid' 
                            ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/10 hover:bg-amber-500/20"
                        )}
                      >
                        {emi.status === 'Paid' ? 'Paid' : 'Mark Paid'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {liability.notes && (
                <div className="mt-4 p-3 bg-white/[0.02] rounded-xl text-xs text-zinc-500 italic">
                  &quot;{liability.notes}&quot;
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-white mb-6">Add Liability</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Loan">Loan</option>
                    <option value="EMI">EMI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Personal">Personal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Lender / Bank</label>
                  <input 
                    type="text" 
                    value={formData.lender}
                    onChange={(e) => setFormData({...formData, lender: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Principal / Loan Amount</label>
                  <input 
                    type="number" 
                    value={formData.principal || ''}
                    onChange={(e) => setFormData({...formData, principal: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">EMI Amount</label>
                  <input 
                    type="number" 
                    value={formData.emiAmount || ''}
                    onChange={(e) => setFormData({...formData, emiAmount: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Total EMI Months</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.totalEMIMonths || ''}
                    onChange={(e) => setFormData({...formData, totalEMIMonths: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g. 60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Due Day (1-31)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="31"
                    value={formData.emiDueDateMonthly}
                    onChange={(e) => setFormData({...formData, emiDueDateMonthly: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              {formData.totalEMIMonths && formData.totalEMIMonths > 0 && formData.emiAmount ? (
                <div className="bg-white/5 p-3 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Total Payable</span>
                    <span className="text-white font-medium">₹{(formData.emiAmount * formData.totalEMIMonths).toLocaleString('en-IN')}</span>
                  </div>
                  {formData.principal ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Interest Component</span>
                      <span className="text-amber-400 font-medium">₹{((formData.emiAmount * formData.totalEMIMonths) - formData.principal).toLocaleString('en-IN')}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">EMI Schedule</span>
                    <span className="text-zinc-400">{formData.totalEMIMonths} months from {formData.startDate ? format(parseISO(formData.startDate), 'MMM yyyy') : '-'}</span>
                  </div>
                </div>
              ) : null}
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Payment Mode</label>
                <select 
                  value={formData.paymentModeDefault}
                  onChange={(e) => setFormData({...formData, paymentModeDefault: e.target.value as PaymentMode})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
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
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors">Save Liability</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
