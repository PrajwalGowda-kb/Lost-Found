/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Search, ArrowRight, ShieldCheck, Zap, Heart } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LostFoundItem } from '../types';
import { useAuth } from '../App';

export default function Home() {
  const { user } = useAuth();
  const [recentItems, setRecentItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRecentItems = async () => {
      setLoading(true);
      let allItems: LostFoundItem[] = [];

      // 1. Fetch from Supabase if configured
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (!error && data) {
          allItems = data.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            location: item.location,
            date: item.date,
            type: item.type,
            imageUrl: item.image_url,
            reporterId: item.reporter_id,
            reporterName: item.reporter_name,
            reporterEmail: item.reporter_email,
            createdAt: item.created_at
          })) as LostFoundItem[];
        } else if (error) {
          console.error('Error fetching recent items:', error);
        }
      }
      
      setRecentItems(allItems);
      setLoading(false);
    };

    fetchRecentItems();

    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('public:items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, fetchRecentItems)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
          <div className="absolute inset-0 bg-radial-at-c from-indigo-50/50 via-white to-white"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
          </span>
          Helping students since 2024
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="max-w-4xl text-4xl font-black tracking-tighter text-gray-900 xs:text-5xl sm:text-7xl lg:text-9xl uppercase"
        >
          Lost <span className="text-indigo-600 italic">?</span> <br />
          <span className="bg-indigo-600 px-4 py-2 text-white rounded-3xl -rotate-1 inline-block mt-4">Found It.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 2 }}
          className="mt-8 sm:mt-12 max-w-2xl text-base font-bold leading-relaxed text-indigo-400/80 sm:text-xl uppercase tracking-widest px-4"
        >
          The campus-wide network for reuniting students with their belonging.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 sm:mt-12 flex w-full max-w-2xl flex-col gap-4 px-6 sm:flex-row"
        >
          <Link to="/report" className="flex h-14 sm:h-16 flex-1 items-center justify-center rounded-2xl sm:rounded-3xl bg-indigo-600 px-8 font-black text-white shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter text-base sm:text-lg">
            Report Item
          </Link>
          <Link to="/browse" className="flex h-14 sm:h-16 flex-1 items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-indigo-100 bg-white px-8 font-black text-indigo-600 shadow-xl shadow-indigo-50 transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter text-base sm:text-lg">
            Browse Gallery
          </Link>
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="mt-8"
        >
           <Link to="/admin" className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 hover:text-indigo-600 flex items-center gap-2 transition-colors">
              <ShieldCheck size={14} />
              Staff Login Portal
           </Link>
        </motion.div>
      </section>

      {/* Stats/Features Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Secure & Trusted", desc: "Verified campus accounts only." },
            { icon: Zap, title: "Real-time Alerts", desc: "Get notified instantly when matches are found." },
            { icon: Heart, title: "Community First", desc: "Built by students, for students." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center rounded-3xl border border-gray-100 bg-gray-50/50 p-8 text-center transition-colors hover:bg-white hover:shadow-xl hover:shadow-indigo-50"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                <feature.icon size={28} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">{feature.title}</h3>
              <p className="text-gray-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Recently Reported</h2>
            <p className="mt-2 text-gray-500">The latest items lost and found on campus.</p>
          </div>
          <Link to="/browse" className="group flex items-center gap-2 font-semibold text-indigo-600">
            View all
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {!user ? (
             <div className="col-span-full flex flex-col items-center rounded-[3rem] border-4 border-dashed border-indigo-100 bg-white py-20 text-center shadow-xl shadow-indigo-50">
               <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-indigo-50 text-indigo-600">
                  <ShieldCheck size={40} />
               </div>
               <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Protected Content</h3>
               <p className="mt-2 max-w-md px-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
                 Sign in with your verified campus account to view live reports and secure the community.
               </p>
               <Link 
                 to="/login"
                 className="mt-8 flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-8 font-black text-white shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter text-sm"
               >
                 Sign In Now
               </Link>
             </div>
          ) : loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100"></div>
            ))
          ) : recentItems.length > 0 ? (
            recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))
          ) : (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-100 py-12 text-center text-gray-500">
              No items reported yet. Be the first!
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 px-8 py-20 text-center text-white shadow-2xl shadow-indigo-200 lg:px-16">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 p-40 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 rounded-full bg-indigo-400/20 p-40 blur-3xl"></div>
          
          <h2 className="relative text-4xl font-extrabold sm:text-5xl lg:text-6xl">Found someone's lost joy?</h2>
          <p className="relative mx-auto mt-6 max-w-2xl text-lg text-indigo-100 sm:text-xl">
            Register it now and help it return home. Every item reported is a smile potential.
          </p>
          
          <div className="relative mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link 
              to={user ? "/report" : "/login"} 
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-8 font-bold text-indigo-600 shadow-xl transition-all hover:bg-indigo-50 active:scale-95"
            >
              {user ? "Report Item Now" : "Sign In to Report"}
            </Link>
            <Link 
              to={user ? "/browse" : "/login"} 
              className="inline-flex h-14 items-center justify-center rounded-2xl border-2 border-white/30 px-8 font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 active:scale-95"
            >
              {user ? "Browse Lost Items" : "Sign In to Browse"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
