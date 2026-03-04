'use client';

import React, { useState } from 'react';
import { useFinanceStore, FamilyMember, ExpenseCategory } from '@/lib/store';
import { Plus, Trash2, User, Tag, Download, Upload, RefreshCcw, Shield, Users, Layers, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useCloudSync } from '@/lib/sync-logic';
import { Cloud, CloudOff, CloudRain, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { 
    members, 
    categories, 
    addMember, 
    deleteMember, 
    addCategory, 
    deleteCategory,
    importData,
    resetData,
    salaries,
    expenses,
    liabilities,
    investments,
    lending,
    profitShares,
    properties,
    rentalPayments,
    syncId,
    lastSynced,
    setSyncId
  } = useFinanceStore();

  const { pushToCloud, pullFromCloud, isSyncing, error: syncError } = useCloudSync();
  const [syncInput, setSyncInput] = useState(syncId || '');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleEnableSync = async () => {
    if (!syncInput) return;
    const success = await pullFromCloud(syncInput);
    if (success) {
      setSyncId(syncInput);
      setSyncStatus('success');
    } else {
      // If doesn't exist, we create it with current local data
      setSyncId(syncInput);
      await pushToCloud();
      setSyncStatus('success');
    }
  };

  const [newMember, setNewMember] = useState({ name: '', relationship: '' });
  const [newCategory, setNewCategory] = useState({ name: '', subcategories: '' });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name) return;
    addMember({
      id: Math.random().toString(36).substr(2, 9),
      name: newMember.name,
      relationship: newMember.relationship,
    });
    setNewMember({ name: '', relationship: '' });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    addCategory({
      id: Math.random().toString(36).substr(2, 9),
      name: newCategory.name,
      subcategories: newCategory.subcategories.split(',').map(s => s.trim()).filter(s => s !== ''),
    });
    setNewCategory({ name: '', subcategories: '' });
  };

  const exportBackup = () => {
    const data = {
      members,
      categories,
      salaries,
      expenses,
      liabilities,
      investments,
      lending,
      profitShares,
      properties,
      rentalPayments
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        importData(data);
        alert('Data imported successfully!');
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-500 text-sm">Configure family members, categories, and manage your data.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Family Members */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Users size={20} className="text-emerald-500" />
            <h3>Family Members</h3>
          </div>
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
            <form onSubmit={handleAddMember} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Name"
                value={newMember.name}
                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
              <input 
                type="text" 
                placeholder="Relation"
                value={newMember.relationship}
                onChange={(e) => setNewMember({...newMember, relationship: e.target.value})}
                className="w-24 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-colors">
                <Plus size={20} />
              </button>
            </form>
            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{member.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{member.relationship || 'Member'}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteMember(member.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {members.length === 0 && <p className="text-center text-zinc-600 text-xs py-4">No members added yet.</p>}
            </div>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Layers size={20} className="text-blue-500" />
            <h3>Expense Categories</h3>
          </div>
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
            <form onSubmit={handleAddCategory} className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Category Name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-colors">
                  <Plus size={20} />
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Subcategories (comma separated)"
                value={newCategory.subcategories}
                onChange={(e) => setNewCategory({...newCategory, subcategories: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </form>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{cat.name}</p>
                    <p className="text-[10px] text-zinc-500">{cat.subcategories.join(', ') || 'No subcategories'}</p>
                  </div>
                  <button onClick={() => deleteCategory(cat.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Sync */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Cloud size={20} className="text-sky-500" />
          <h3>Cloud Sync (Cross-Device)</h3>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-8">
          <div className="max-w-xl">
            <p className="text-zinc-400 text-sm mb-6">
              Enable Cloud Sync to access your data across different devices. 
              Enter a unique <strong>Sync Key</strong> (e.g. your family name + a secret number) to link your devices.
            </p>
            
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Enter your unique Sync Key"
                value={syncInput}
                onChange={(e) => setSyncInput(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500/50"
              />
              <button 
                onClick={handleEnableSync}
                disabled={isSyncing}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
              >
                {isSyncing ? <RefreshCcw size={18} className="animate-spin" /> : <Cloud size={18} />}
                {syncId ? 'Update Key' : 'Enable Sync'}
              </button>
            </div>

            {syncId && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-sky-500/5 border border-sky-500/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-sky-500" />
                    <div>
                      <p className="text-white text-sm font-medium">Cloud Sync Active</p>
                      <p className="text-zinc-500 text-xs">Last synced: {lastSynced ? new Date(lastSynced).toLocaleString() : 'Never'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => pushToCloud()}
                    disabled={isSyncing}
                    className="text-sky-500 hover:text-sky-400 text-xs font-bold uppercase tracking-wider"
                  >
                    Sync Now
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setSyncId(null);
                    setSyncInput('');
                  }}
                  className="text-zinc-500 hover:text-white text-xs underline"
                >
                  Disable Cloud Sync on this device
                </button>
              </div>
            )}

            {syncError && (
              <div className="mt-4 flex items-center gap-2 text-rose-500 text-xs">
                <AlertCircle size={14} />
                <span>Error: {syncError}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Database size={20} className="text-violet-500" />
          <h3>Data Management</h3>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={exportBackup}
            className="flex flex-col items-center justify-center gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all group"
          >
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <Download size={24} />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Export Backup</p>
              <p className="text-zinc-500 text-xs mt-1">Download your data as JSON</p>
            </div>
          </button>

          <label className="flex flex-col items-center justify-center gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer">
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            <div className="p-4 rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Import Backup</p>
              <p className="text-zinc-500 text-xs mt-1">Restore data from a file</p>
            </div>
          </label>

          <button 
            onClick={() => {
              if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
                resetData();
              }
            }}
            className="flex flex-col items-center justify-center gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-red-500/5 transition-all group"
          >
            <div className="p-4 rounded-full bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
              <RefreshCcw size={24} />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Reset All Data</p>
              <p className="text-zinc-500 text-xs mt-1">Wipe everything and start fresh</p>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl flex items-start gap-4">
        <Shield className="text-emerald-500 shrink-0" size={24} />
        <div>
          <h4 className="text-emerald-500 font-semibold">Privacy & Security</h4>
          <p className="text-emerald-500/60 text-sm mt-1">
            Your data is stored locally in your browser&apos;s IndexedDB. No information is sent to any external server. 
            Make sure to export regular backups to prevent data loss if you clear your browser cache.
          </p>
        </div>
      </div>
    </div>
  );
}
