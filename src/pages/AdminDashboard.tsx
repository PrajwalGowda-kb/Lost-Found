import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LostFoundItem } from '../types';
import { Trash2, ShieldCheck, LogOut, Search, ExternalLink, Calendar, MapPin, RefreshCw, Layers, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const { isAdmin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security Gate
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  const fetchItems = async () => {
    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase is not configured properly in Settings.");
      return;
    }
    setLoading(true);
    setIsRefreshing(true);
    setErrorMessage(null);
    
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      setErrorMessage(`${error.message} (${error.code})`);
    } else if (data) {
      const mapped = data.map(item => ({
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
        reporterAvatarUrl: item.reporter_avatar_url,
        createdAt: item.created_at
      })) as LostFoundItem[];
      setItems(mapped);
    }
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchItems();

    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('public:items_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, fetchItems)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this item? This action is permanent.")) return;

    try {
      if (typeof id === 'string' && !id.startsWith('demo-')) {
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      setItems(prev => prev.filter(item => item.id !== id));
      alert("Item successfully deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete item.");
    }
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-40 border-b-4 border-indigo-600 bg-white shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-900 text-white shadow-lg">
              <ShieldCheck size={24} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-gray-900 leading-none">Management Console</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mt-1">Authorized Activity Monitor</p>
            </div>
          </div>

          <button 
            onClick={() => {
              logoutAdmin();
              navigate('/admin');
            }}
            className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-600 border-2 border-rose-100 transition-all hover:bg-rose-100"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="mb-10 grid gap-6 sm:grid-cols-4">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-indigo-100/50 border-2 border-indigo-50">
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Reports</p>
             <p className="text-3xl font-black text-gray-900">{items.length}</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-indigo-100/50 border-2 border-indigo-50">
             <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">Lost Items</p>
             <p className="text-3xl font-black text-rose-600">{items.filter(i => i.type === 'lost').length}</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-indigo-100/50 border-2 border-indigo-50">
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Found Items</p>
             <p className="text-3xl font-black text-emerald-600">{items.filter(i => i.type === 'found').length}</p>
          </div>
          <div className="rounded-[2rem] bg-indigo-900 p-6 shadow-xl shadow-indigo-100/50 text-white">
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Admin Session</p>
             <p className="text-sm font-bold truncate">7204769979</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-8 flex items-center gap-3 rounded-[2rem] bg-rose-50 p-6 border-2 border-rose-100 text-rose-600">
            <ShieldAlert size={24} strokeWidth={3} className="shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Database Connection Error</p>
              <p className="font-bold text-sm">{errorMessage}</p>
              <p className="text-[9px] mt-1 opacity-70">Check your Supabase Role Level Security (RLS) rules or project credentials.</p>
            </div>
          </div>
        )}

        {/* Dashboard Controls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-300" size={18} strokeWidth={3} />
            <input 
              type="text" 
              placeholder="SEARCH USERS, ITEMS, OR LOCATIONS..."
              className="w-full rounded-2xl border-2 border-indigo-50 bg-white py-4 pl-14 pr-4 text-xs font-black tracking-widest uppercase transition-all focus:border-indigo-600 focus:outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={fetchItems}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Refresh Feed
          </button>
        </div>

        {/* Inventory List */}
        <div className="overflow-hidden rounded-[2.5rem] border-2 border-indigo-100 bg-white shadow-2xl shadow-indigo-100/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-indigo-50/50 border-b-2 border-indigo-50">
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-indigo-400">Item Details</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-indigo-400">Reporter</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-indigo-400">Context</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-indigo-400">Type</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-indigo-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-indigo-50">
                {loading ? (
                   [1,2,3].map(i => (
                     <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="h-20 px-6">
                           <div className="h-10 w-full rounded-xl bg-gray-50"></div>
                        </td>
                     </tr>
                   ))
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover border-2 border-indigo-50" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-300">
                              <Layers size={20} />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900">{item.title}</p>
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-tighter">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-gray-900">{item.reporterName}</p>
                          <p className="text-[10px] lowercase text-gray-400 font-medium">{item.reporterEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                            <MapPin size={12} className="text-indigo-400" />
                            {item.location}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                            <Calendar size={12} className="text-indigo-400" />
                            {item.date}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                          item.type === 'lost' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                            onClick={() => handleDelete(item.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-600 hover:text-white"
                           >
                             <Trash2 size={16} />
                           </button>
                           <Link 
                            to="/browse"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white"
                           >
                             <ExternalLink size={16} />
                           </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <p className="text-xl font-bold text-gray-400">No matching reports found in database.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Debug Connection Status */}
        <div className="mt-8 flex items-center justify-between rounded-2xl bg-gray-900 p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
           <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", items.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-700")}></div>
              <span>Connection: {isSupabaseConfigured ? 'LIVE' : 'DISCONNECTED'}</span>
           </div>
           <div className="flex gap-4">
              <span>DB Table: items</span>
              <span>Loaded Count: {items.length}</span>
              <span>Filter State: {searchQuery ? 'ACTIVE' : 'NONE'}</span>
           </div>
        </div>
      </main>
    </div>
  );
}
