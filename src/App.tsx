/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import React, { useEffect, useState, createContext, useContext } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Report from './pages/Report';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { AnimatePresence, motion } from 'motion/react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { Navigate } from 'react-router-dom';

// Auth Context
const AuthContext = createContext<{ 
  user: User | null; 
  loading: boolean;
  isAdmin: boolean;
  loginAdmin: () => void;
  logoutAdmin: () => void;
}>({ 
  user: null, 
  loading: true,
  isAdmin: false,
  loginAdmin: () => {},
  logoutAdmin: () => {}
});
export const useAuth = () => useContext(AuthContext);

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Home />
          </motion.div>
        } />
        <Route path="/browse" element={
          <RequireAuth>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Browse />
            </motion.div>
          </RequireAuth>
        } />
        <Route path="/report" element={
          <RequireAuth>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Report />
            </motion.div>
          </RequireAuth>
        } />
        <Route path="/login" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Login />
          </motion.div>
        } />
        <Route path="/admin" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <AdminLogin />
          </motion.div>
        } />
        <Route path="/admin/dashboard" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <AdminDashboard />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('is_admin') === 'true';
  });

  const loginAdmin = () => {
    setIsAdmin(true);
    localStorage.setItem('is_admin', 'true');
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('is_admin');
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, loginAdmin, logoutAdmin }}>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
          <Navbar />
          <main>
            <AnimatedRoutes />
          </main>
          
          {/* Simple Footer */}
        <footer className="border-t border-gray-100 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
              <span className="text-xl font-bold tracking-tighter text-gray-900 italic">Beacon</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2026 Beacon Campus Lost & Found. Connecting community, one item at a time.
            </p>
            <div className="mt-6 flex justify-center gap-6 text-sm font-medium text-gray-400">
              <a href="#" className="hover:text-indigo-600">Safety Tips</a>
              <a href="#" className="hover:text-indigo-600">Terms of Service</a>
              <Link to="/admin" className="hover:text-indigo-900 border-l-2 border-gray-100 pl-6">Admin Access</Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
    </AuthContext.Provider>
  );
}

