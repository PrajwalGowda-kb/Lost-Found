import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User as UserIcon, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const { loginAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already admin, redirect to dashboard
  React.useEffect(() => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isAdmin, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Hardcoded restricted credentials as per user request
    const ADMIN_PHONE = '7204769979';
    const ADMIN_PASS = '20231CSE0538';

    setTimeout(() => {
      if (phone === ADMIN_PHONE && password === ADMIN_PASS) {
        loginAdmin();
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin credentials. Access denied.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute inset-0 bg-radial-at-c from-indigo-50/50 via-white to-white"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-[3rem] border-4 border-indigo-600 bg-white p-6 shadow-2xl shadow-indigo-200 md:p-12"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-900 text-white shadow-xl">
            <ShieldCheck size={32} strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Admin Portal</h1>
          <p className="mt-2 font-bold text-indigo-400 text-xs uppercase tracking-widest">Authorized Personnel Only</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 p-4 text-center border-2 border-rose-100">
            <p className="text-xs font-black uppercase text-rose-500 tracking-wider font-mono">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="relative">
            <UserIcon className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
            <input 
              required
              type="text" 
              placeholder="ADMIN PHONE NUMBER"
              className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-4 pl-14 pr-4 font-black transition-all focus:border-indigo-600 focus:bg-white focus:outline-none uppercase text-xs tracking-widest"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
            <input 
              required
              type="password" 
              placeholder="SECURE PASSWORD"
              className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-4 pl-14 pr-4 font-black transition-all focus:border-indigo-600 focus:bg-white focus:outline-none uppercase text-xs tracking-widest"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-indigo-900 font-black text-white shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-tighter"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Enter Management'}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Access is logged and monitored for security.
            </p>
        </div>
      </motion.div>
    </div>
  );
}
