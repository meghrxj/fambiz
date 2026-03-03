'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

export const PasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#141414] border border-white/5 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
            <Lock className="text-emerald-500 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Family Finance OS</h1>
          <p className="text-zinc-500 text-sm mt-2">Enter password to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs mt-2 ml-1">Incorrect password</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            Unlock Dashboard
          </button>
        </form>
      </motion.div>
    </div>
  );
};
