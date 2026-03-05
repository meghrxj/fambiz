'use client';

import React, { useState } from 'react';
import { useFinanceStore, RentalProperty, RentalPayment, PaymentMode } from '@/lib/store';
import { Plus, Building2, Calendar, TrendingUp, Trash2, Edit2, ChevronRight, Receipt, CheckCircle2, Clock, Landmark } from 'lucide-react';
import { format, addMonths, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function RentalIncomePage() {
  const { properties, rentalPayments, addProperty, deleteProperty, updateProperty, addRentalPayment, addRentalPaymentRange, deleteRentalPayment } = useFinanceStore();
  const [isPropModalOpen, setIsPropModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const [propFormData, setPropFormData] = useState<Partial<RentalProperty>>({
    name: '',
    tenantName: '',
    rentAmount: 0,
    rentStartDate: new Date().toISOString().split('T')[0],
    incrementRule: 'Percentage',
    incrementValue: 10,
    incrementEveryMonths: 12,
    depositAmount: 0,
    depositDate: new Date().toISOString().split('T')[0],
    partnerSplitPercent: 0,
    partnerName: '',
  });

  const [paymentFormData, setPaymentFormData] = useState<Partial<RentalPayment>>({
    propertyId: '',
    amountPaid: 0,
    baseAmount: 0,
    sgst: 0,
    cgst: 0,
    tds: 0,
    dueDate: new Date().toISOString().split('T')[0],
    paidDate: new Date().toISOString().split('T')[0],
    monthFor: format(new Date(), 'yyyy-MM'),
    status: 'Paid',
    paymentMode: 'Bank Transfer',
    invoiceDate: new Date().toISOString().split('T')[0],
    isPartnerPaid: false,
    partnerAmount: 0,
  });

  const [rangeData, setRangeData] = useState({
    propertyId: '',
    startDate: format(new Date(), 'yyyy-MM'),
    endDate: format(new Date(), 'yyyy-MM'),
  });

  // Auto-calculate taxes when base amount changes
  const handleBaseAmountChange = (val: number) => {
    const sgst = Number((val * 0.09).toFixed(2));
    const cgst = Number((val * 0.09).toFixed(2));
    const tds = Number((val * 0.10).toFixed(2));
    const total = Number((val + sgst + cgst - tds).toFixed(2));
    
    setPaymentFormData({
      ...paymentFormData,
      baseAmount: val,
      sgst,
      cgst,
      tds,
      amountPaid: total
    });
  };

  const handlePropSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextIncrementDate = addMonths(parseISO(propFormData.rentStartDate!), propFormData.incrementEveryMonths!).toISOString();
    
    addProperty({
      ...propFormData,
      id: Math.random().toString(36).substr(2, 9),
      nextIncrementDate,
    } as RentalProperty);
    
    setIsPropModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const property = properties.find(p => p.id === paymentFormData.propertyId);
    const partnerAmount = property?.partnerSplitPercent ? Number((paymentFormData.amountPaid! * property.partnerSplitPercent / 100).toFixed(2)) : 0;

    addRentalPayment({
      ...paymentFormData,
      id: Math.random().toString(36).substr(2, 9),
      partnerAmount,
    } as RentalPayment);
    setIsPaymentModalOpen(false);
  };

  const handleRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeData.propertyId || !rangeData.startDate || !rangeData.endDate) return;
    
    addRentalPaymentRange(
      rangeData.propertyId,
      rangeData.startDate + '-01',
      rangeData.endDate + '-01'
    );
    
    setIsRangeModalOpen(false);
  };

  const totalMonthlyRent = properties.reduce((acc, p) => acc + p.rentAmount, 0);
  const totalDeposits = properties.reduce((acc, p) => acc + (p.depositAmount || 0), 0);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Rental Income</h1>
          <p className="text-zinc-500 text-sm">Track properties, tenants, and rent collections.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsRangeModalOpen(true)}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <Calendar size={18} /> Bulk Generate
          </button>
          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <Receipt size={18} /> Record Payment
          </button>
          <button 
            onClick={() => setIsPropModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Add Property
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Building2 size={18} />
            </div>
            <span className="text-zinc-500 text-sm font-medium">Total Monthly Rent</span>
          </div>
          <h3 className="text-2xl font-bold text-white">₹{totalMonthlyRent.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Landmark size={18} />
            </div>
            <span className="text-zinc-500 text-sm font-medium">Total Deposits</span>
          </div>
          <h3 className="text-2xl font-bold text-white">₹{totalDeposits.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <TrendingUp size={18} />
            </div>
            <span className="text-zinc-500 text-sm font-medium">Properties</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{properties.length}</h3>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop) => {
          const payments = rentalPayments.filter(p => p.propertyId === prop.id);
          const totalCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);
          
          return (
            <div key={prop.id} className="bg-[#141414] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Building2 className="text-emerald-500" size={24} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteProperty(prop.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white">{prop.name}</h3>
              <p className="text-zinc-500 text-sm mb-4">{prop.tenantName || 'No tenant'}</p>
              
              <div className="space-y-3 border-t border-white/5 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Monthly Rent</span>
                  <span className="text-white font-medium">₹{prop.rentAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Deposit</span>
                  <span className="text-white font-medium">₹{prop.depositAmount?.toLocaleString('en-IN') || '-'}</span>
                </div>
                {prop.partnerName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Partner Split ({prop.partnerSplitPercent}%)</span>
                    <span className="text-blue-400 font-medium">{prop.partnerName}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Next Increment</span>
                  <span className="text-amber-500 font-medium">{format(parseISO(prop.nextIncrementDate), 'MMM yyyy')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total Collected</span>
                  <span className="text-emerald-400 font-medium">₹{totalCollected.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedPropertyId(selectedPropertyId === prop.id ? null : prop.id)}
                className="w-full mt-6 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                {selectedPropertyId === prop.id ? 'Hide Payments' : 'View Payments'}
                <ChevronRight size={14} className={cn("transition-transform", selectedPropertyId === prop.id && "rotate-90")} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Payments Table for Selected Property */}
      {selectedPropertyId && (
        <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <h3 className="font-semibold text-white">
              Payment History: {properties.find(p => p.id === selectedPropertyId)?.name}
            </h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-6 py-4 font-medium text-zinc-400">Month For</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Base</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Total Paid</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Partner Split</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Paid Date</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Mode</th>
                <th className="px-6 py-4 font-medium text-zinc-400">Status</th>
                <th className="px-6 py-4 font-medium text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rentalPayments.filter(p => p.propertyId === selectedPropertyId).map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{payment.monthFor}</td>
                  <td className="px-6 py-4 text-zinc-400">₹{payment.baseAmount?.toLocaleString('en-IN') || '-'}</td>
                  <td className="px-6 py-4 text-emerald-400 font-semibold">₹{payment.amountPaid.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-blue-400 text-xs font-medium">₹{payment.partnerAmount?.toLocaleString('en-IN') || '0'}</span>
                      <span className={cn("text-[10px] font-bold uppercase", payment.isPartnerPaid ? "text-emerald-500" : "text-amber-500")}>
                        {payment.isPartnerPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{format(parseISO(payment.paidDate), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-zinc-500">{payment.paymentMode}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      payment.status === 'Paid' ? "bg-emerald-500/10 text-emerald-500" : 
                      payment.status === 'Late' ? "bg-amber-500/10 text-amber-500" : "bg-zinc-500/10 text-zinc-500"
                    )}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteRentalPayment(payment.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Property Modal */}
      {isPropModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-white mb-6">Add New Property</h2>
            <form onSubmit={handlePropSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Property Name</label>
                  <input 
                    type="text" 
                    value={propFormData.name}
                    onChange={(e) => setPropFormData({...propFormData, name: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Tenant Name</label>
                  <input 
                    type="text" 
                    value={propFormData.tenantName}
                    onChange={(e) => setPropFormData({...propFormData, tenantName: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Monthly Rent</label>
                  <input 
                    type="number" 
                    value={propFormData.rentAmount || ''}
                    onChange={(e) => setPropFormData({...propFormData, rentAmount: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Start Date</label>
                  <input 
                    type="date" 
                    value={propFormData.rentStartDate}
                    onChange={(e) => setPropFormData({...propFormData, rentStartDate: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Rent Increment Rules</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Type</label>
                    <select 
                      value={propFormData.incrementRule}
                      onChange={(e) => setPropFormData({...propFormData, incrementRule: e.target.value as any})}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="Percentage">%</option>
                      <option value="Fixed">Fixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Value</label>
                    <input 
                      type="number" 
                      value={propFormData.incrementValue}
                      onChange={(e) => setPropFormData({...propFormData, incrementValue: Number(e.target.value)})}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Every (Months)</label>
                    <input 
                      type="number" 
                      value={propFormData.incrementEveryMonths}
                      onChange={(e) => setPropFormData({...propFormData, incrementEveryMonths: Number(e.target.value)})}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Deposit Amount</label>
                  <input 
                    type="number" 
                    value={propFormData.depositAmount || ''}
                    onChange={(e) => setPropFormData({...propFormData, depositAmount: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Deposit Date</label>
                  <input 
                    type="date" 
                    value={propFormData.depositDate}
                    onChange={(e) => setPropFormData({...propFormData, depositDate: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Partner Name</label>
                  <input 
                    type="text" 
                    value={propFormData.partnerName}
                    onChange={(e) => setPropFormData({...propFormData, partnerName: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Partner Split %</label>
                  <input 
                    type="number" 
                    value={propFormData.partnerSplitPercent || ''}
                    onChange={(e) => setPropFormData({...propFormData, partnerSplitPercent: Number(e.target.value)})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsPropModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors">Add Property</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Record Rent Payment</h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Property</label>
                <select 
                  value={paymentFormData.propertyId}
                  onChange={(e) => {
                    const prop = properties.find(p => p.id === e.target.value);
                    setPaymentFormData({
                      ...paymentFormData, 
                      propertyId: e.target.value,
                      amountPaid: prop?.rentAmount || 0
                    });
                  }}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Base Rent Amount</label>
                  <input 
                    type="number" 
                    value={paymentFormData.baseAmount || ''}
                    onChange={(e) => handleBaseAmountChange(Number(e.target.value))}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Month For</label>
                  <input 
                    type="month" 
                    value={paymentFormData.monthFor}
                    onChange={(e) => setPaymentFormData({...paymentFormData, monthFor: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-white/5 p-3 rounded-xl">
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">SGST (9%)</label>
                  <input type="number" value={paymentFormData.sgst} readOnly className="w-full bg-transparent text-white text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">CGST (9%)</label>
                  <input type="number" value={paymentFormData.cgst} readOnly className="w-full bg-transparent text-white text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">TDS (10%)</label>
                  <input type="number" value={paymentFormData.tds} readOnly className="w-full bg-transparent text-rose-400 text-xs outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Total Amount Paid</label>
                <input 
                  type="number" 
                  value={paymentFormData.amountPaid || ''}
                  onChange={(e) => setPaymentFormData({...paymentFormData, amountPaid: Number(e.target.value)})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Paid Date</label>
                  <input 
                    type="date" 
                    value={paymentFormData.paidDate}
                    onChange={(e) => setPaymentFormData({...paymentFormData, paidDate: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Invoice Date</label>
                  <input 
                    type="date" 
                    value={paymentFormData.invoiceDate}
                    onChange={(e) => setPaymentFormData({...paymentFormData, invoiceDate: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Mode</label>
                  <select 
                    value={paymentFormData.paymentMode}
                    onChange={(e) => setPaymentFormData({...paymentFormData, paymentMode: e.target.value as PaymentMode})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Status</label>
                  <select 
                    value={paymentFormData.status}
                    onChange={(e) => setPaymentFormData({...paymentFormData, status: e.target.value as any})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Range Modal */}
      {isRangeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Bulk Generate Payments</h2>
            <form onSubmit={handleRangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Property</label>
                <select 
                  value={rangeData.propertyId}
                  onChange={(e) => setRangeData({...rangeData, propertyId: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
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
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsRangeModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-xl transition-colors">Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
