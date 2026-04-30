/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, User, Box, LogOut, ShieldCheck, ShieldAlert, LayoutDashboard, ChevronDown, Mail, Calendar, HelpCircle } from 'lucide-react';
import { useAuth } from '../App';
import { logout, isSupabaseConfigured } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, loading, isAdmin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowProfile(false);
    if (isAdmin) {
      logoutAdmin();
      navigate('/admin');
      window.location.reload();
    } else {
      try {
        // High-priority logout attempt
        const logoutPromise = logout();
        // Give it 2 seconds, if it doesn't finish, we force it locally anyway
        await Promise.race([
          logoutPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
        ]);
        
        window.location.href = '/'; 
      } catch (err) {
        console.error("Logout process error/timeout:", err);
        // Fatal fallback: clear everything and redirect
        localStorage.clear();
        sessionStorage.clear();
        window.location.assign('/');
      }
    }
  };

  return (
    <nav className="sticky top-6 z-50 mx-auto mt-6 w-[calc(100%-3rem)] max-w-7xl rounded-3xl border-2 border-indigo-100 bg-white p-2 shadow-xl">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex items-center gap-3 transition-transform hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <Box size={22} strokeWidth={3} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tighter text-gray-900 uppercase">Beacon</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Campus Hub</span>
          </div>
        </Link>
        
        {!isAdmin && (
          <div className="hidden md:flex md:items-center md:gap-4">
            <Link to="/" className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">Home</Link>
            <Link to="/browse" className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">Browse</Link>
            <Link to="/report" className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">Report</Link>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-3" ref={menuRef}>
          {isAdmin && (
            <Link 
              to="/admin/dashboard" 
              className="hidden lg:flex items-center gap-2 rounded-xl bg-indigo-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <LayoutDashboard size={14} />
              Admin Panel
            </Link>
          )}

          {loading ? (
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-gray-100"></div>
          ) : user || isAdmin ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border-2 p-1 transition-all hover:border-indigo-600",
                  showProfile ? "border-indigo-600 bg-indigo-50" : "border-indigo-100 bg-white"
                )}
              >
                <div className="h-8 w-8 sm:h-9 sm:w-9 overflow-hidden rounded-xl border-2 border-transparent shadow-sm p-0.5 bg-indigo-50 flex items-center justify-center">
                  {isAdmin ? (
                    <ShieldCheck size={18} className="text-indigo-900" strokeWidth={3} />
                  ) : user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt={user.user_metadata.full_name || 'User'} 
                      className="h-full w-full rounded-lg object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <User size={18} className="text-indigo-400" strokeWidth={3} />
                  )}
                </div>
                <ChevronDown size={14} className={cn("text-gray-400 transition-transform hidden sm:block", showProfile && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-72 overflow-hidden rounded-[2.5rem] border-2 border-indigo-100 bg-white p-2 shadow-2xl shadow-indigo-100/50"
                  >
                    {/* Profile Header */}
                    <div className="p-6 text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-indigo-50 bg-indigo-50 shadow-lg">
                        {isAdmin ? (
                          <ShieldCheck size={40} className="text-indigo-900" strokeWidth={2.5} />
                        ) : user?.user_metadata?.avatar_url ? (
                          <img 
                            src={user.user_metadata.avatar_url} 
                            alt={user.user_metadata.full_name || 'User'} 
                            className="h-full w-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <User size={40} className="text-indigo-200" strokeWidth={2.5} />
                        )}
                      </div>
                      <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none">
                        {isAdmin ? "Campus Admin" : (user?.user_metadata?.full_name || 'User')}
                      </h4>
                      <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        <Mail size={10} strokeWidth={3} />
                        {isAdmin ? "security@campus.edu" : (user?.email || 'No email')}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-1 p-2">
                       {!isAdmin && (
                         <Link 
                          to="/browse?filter=mine" 
                          onClick={() => setShowProfile(false)}
                          className="flex items-center gap-3 rounded-2xl p-3 text-xs font-bold text-gray-500 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                         >
                           <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border-2 border-indigo-50 text-indigo-600">
                              <Box size={14} strokeWidth={3} />
                           </div>
                           My Reports
                         </Link>
                       )}
                       <button className="flex w-full items-center gap-3 rounded-2xl p-3 text-xs font-bold text-gray-500 transition-all hover:bg-indigo-50 hover:text-indigo-600">
                         <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border-2 border-indigo-50 text-indigo-600">
                            <HelpCircle size={14} strokeWidth={3} />
                         </div>
                         Support
                       </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-2 border-t-2 border-indigo-50 p-2">
                      <button 
                        onClick={handleLogout}
                        className="flex w-full items-center justify-between rounded-[2rem] bg-rose-50 px-6 py-4 text-xs font-black uppercase tracking-widest text-rose-600 transition-all hover:bg-rose-100"
                      >
                        Sign Out
                        <LogOut size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link 
              to="/login"
              className="flex h-10 items-center gap-2 rounded-2xl border-2 border-indigo-600 px-3 sm:px-4 text-xs sm:text-sm font-black text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white"
            >
              <User size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={3} />
              <span className="hidden xs:inline">SIGN IN</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}


