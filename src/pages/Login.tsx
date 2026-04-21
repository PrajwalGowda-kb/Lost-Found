import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Box, Wand2, Mail, Lock, User as UserIcon, Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { signInWithGoogle, isSupabaseConfigured, signInWithEmail, signUpWithEmail, resetPassword, updatePassword } from '../lib/supabase';
import { useAuth } from '../App';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>(
    searchParams.get('mode') === 'reset' ? 'reset' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect to home
  React.useEffect(() => {
    if (user && authMode !== 'reset') {
      navigate('/');
    }
  }, [user, navigate, authMode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessStatus(null);
    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password, fullName);
        setSuccessStatus("Success! Please check your email for the confirmation link.");
      } else if (authMode === 'signin') {
        await signInWithEmail(email, password);
      } else if (authMode === 'forgot') {
        await resetPassword(email);
        setSuccessStatus("Password reset link sent! Check your inbox.");
      } else if (authMode === 'reset') {
        await updatePassword(password);
        setSuccessStatus("Password successfully updated. You can now sign in.");
        setTimeout(() => setAuthMode('signin'), 2000);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = err.message || "An error occurred during authentication.";
      
      // Student-friendly error mapping
      if (message.includes("Invalid login credentials")) {
        message = "Incorrect email or password. Please try again.";
      } else if (message.includes("Email not confirmed")) {
        message = "Your email isn't verified yet. Check your inbox for the link!";
      } else if (message.includes("after 30 seconds")) {
        message = "Too many attempts! Please wait 30 seconds before trying again.";
      }

      setErrorStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute inset-0 bg-radial-at-c from-indigo-50/50 via-white to-white"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-[3rem] border-2 border-indigo-100 bg-white p-6 shadow-2xl shadow-indigo-100 md:p-12"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100">
            <Box size={32} strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
            {authMode === 'signin' && 'Welcome Back'}
            {authMode === 'signup' && 'Create Account'}
            {authMode === 'forgot' && 'Reset Link'}
            {authMode === 'reset' && 'New Creds'}
          </h1>
          <p className="mt-2 font-bold text-indigo-400 text-xs uppercase tracking-widest">
            {authMode === 'signin' && 'Sign in to manage your reports'}
            {authMode === 'signup' && 'Join the campus network today'}
            {authMode === 'forgot' && 'Send a secure recovery link'}
            {authMode === 'reset' && 'Secure your account with a new pass'}
          </p>
        </div>

        {errorStatus && (
          <div className="mb-6 rounded-2xl bg-rose-50 p-4 text-center border-2 border-rose-100">
            <p className="text-xs font-black uppercase text-rose-500 tracking-wider font-mono">{errorStatus}</p>
          </div>
        )}

        {successStatus && (
          <div className="mb-6 rounded-2xl bg-emerald-50 p-4 text-center border-2 border-emerald-100">
            <p className="text-xs font-black uppercase text-emerald-600 tracking-wider font-mono">{successStatus}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="grid gap-4">
          {authMode === 'signup' && (
            <div className="relative">
              <UserIcon className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
              <input 
                required
                type="text" 
                placeholder="FULL NAME"
                className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-4 pl-14 pr-4 font-black transition-all focus:border-indigo-600 focus:bg-white focus:outline-none uppercase text-xs tracking-widest"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          )}

          {authMode !== 'reset' && (
            <div className="relative">
              <Mail className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
              <input 
                required
                type="email" 
                placeholder="COLLEGE EMAIL"
                className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-4 pl-14 pr-4 font-black transition-all focus:border-indigo-600 focus:bg-white focus:outline-none uppercase text-xs tracking-widest"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          )}

          {authMode !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
              <input 
                required
                type="password" 
                placeholder={authMode === 'reset' ? "NEW PASSWORD" : "PASSWORD"}
                className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-4 pl-14 pr-4 font-black transition-all focus:border-indigo-600 focus:bg-white focus:outline-none uppercase text-xs tracking-widest"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-indigo-600 font-black text-white shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-tighter"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (
              authMode === 'signin' ? 'Sign In Now' : 
              authMode === 'signup' ? 'Create My Account' :
              authMode === 'forgot' ? 'Send Link' : 'Update Pass'
            )}
          </button>
        </form>

        <div className="relative my-8 flex items-center justify-center">
          <div className="absolute h-[1px] w-full bg-gray-100"></div>
          <span className="relative bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-300">Social Connect</span>
        </div>

        <div className="grid gap-3">
          <button 
            onClick={() => signInWithGoogle()}
            className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-indigo-100 bg-white font-black text-gray-700 shadow-sm transition-all hover:bg-indigo-50 hover:border-indigo-200 active:scale-95 uppercase tracking-tighter"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5 grayscale transition-all group-hover:grayscale-0" referrerPolicy="no-referrer" />
            Continue with Google
          </button>
        </div>

        <div className="mt-8 grid gap-4 text-center">
          {authMode === 'signin' && (
            <button 
              onClick={() => setAuthMode('forgot')}
              className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-600"
            >
              Forgot Password?
            </button>
          )}

          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            {(authMode === 'signin' || authMode === 'forgot') && "Don't have an account?"}
            {authMode === 'signup' && "Already have an account?"}
            {authMode === 'reset' && "Back to sign in?"}
            {' '}
            <button 
              onClick={() => {
                if (authMode === 'signup' || authMode === 'forgot' || authMode === 'reset') setAuthMode('signin');
                else setAuthMode('signup');
              }}
              className="text-indigo-600 hover:underline"
            >
              {(authMode === 'signin' || authMode === 'reset') && 'Sign Up'}
              {authMode === 'signup' && 'Sign In'}
              {authMode === 'forgot' && 'Sign In'}
            </button>
          </p>

          <Link 
            to="/admin" 
            className="mt-4 inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 hover:text-indigo-600 transition-colors"
          >
            <ShieldCheck size={12} />
            Staff Portal Access
          </Link>
        </div>

        {!isSupabaseConfigured && (
          <div className="mt-10 rounded-2xl bg-rose-50 p-6 text-center border-2 border-rose-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">
              Supabase Not Configured
            </p>
            <p className="mt-1 text-[9px] font-medium text-rose-400 leading-tight">
              Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Settings &gt; Secrets for real login to work.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
