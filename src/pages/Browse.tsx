/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, User as UserIcon, Mail, Phone, Hash, ExternalLink } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { CATEGORIES, LostFoundItem } from '../types';
import { cn } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../App';
import { useSearchParams } from 'react-router-dom';

export default function Browse() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'directory'>('items');
  
  const filterParam = searchParams.get('filter');
  const userIdParam = searchParams.get('userId');
  const userNameParam = searchParams.get('userName');
  const filterMine = filterParam === 'mine' || (filterParam === 'user' && userIdParam === user?.id);
  const filteringSpecificUser = filterParam === 'user' && userIdParam && userIdParam !== user?.id;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const fetchItems = async () => {
      setLoading(true);
      let allItems: LostFoundItem[] = [];

      // 1. Fetch from Supabase
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
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
            reporterPhone: item.reporter_phone,
            reporterRollNo: item.reporter_roll_no,
            reporterAvatarUrl: item.reporter_avatar_url,
            createdAt: item.created_at
          })) as LostFoundItem[];
          
          allItems = mapped;

          // Build User Directory
          const userMap = new Map();
          mapped.forEach(item => {
            if (!userMap.has(item.reporterId)) {
              userMap.set(item.reporterId, {
                id: item.reporterId,
                name: item.reporterName,
                email: item.reporterEmail,
                avatarUrl: item.reporterAvatarUrl,
                phone: item.reporterPhone,
                rollNo: item.reporterRollNo,
                reportsCount: 0
              });
            }
            userMap.get(item.reporterId).reportsCount++;
          });
          setUsers(Array.from(userMap.values()));
        } else if (error) {
          console.error("Error fetching items:", error);
        }
      }

      setItems(allItems);
      setLoading(false);
    };

    fetchItems();

    const subscription = supabase
      .channel('public:items_browse')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, fetchItems)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.reporterRollNo && item.reporterRollNo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    
    // User Filtering Logic
    let matchesUser = true;
    if (filterParam === 'mine') {
       matchesUser = item.reporterId === user?.id;
    } else if (filterParam === 'user' && userIdParam) {
       matchesUser = item.reporterId === userIdParam;
    }

    return matchesSearch && matchesCategory && matchesUser;
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.rollNo && u.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          {filterMine ? "Your Activity" : "Explore Items"}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-500">
          {filterMine ? "Manage and track the reports you've shared." : "Search through everything reported on campus."}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="lg:sticky lg:top-32 space-y-6">
            <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-100 hidden lg:block">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Beacon<br/>Found.</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200 mt-2">Campus Community Hub</p>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-xl border-2 border-indigo-50 space-y-8">
              <div>
                <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-indigo-400">Search</h3>
                <div className="relative">
                  <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-indigo-300" size={16} strokeWidth={3} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter items..." 
                    className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-3 pl-11 pr-4 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-indigo-400">Your Activity</h3>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    if (filterMine) newParams.delete('filter');
                    else newParams.set('filter', 'mine');
                    setSearchParams(newParams);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-4 py-2 text-xs font-bold transition-all ring-2 ring-transparent",
                    filterMine 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 ring-indigo-200" 
                      : "bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <UserIcon size={14} strokeWidth={3} />
                    <span>My Reports</span>
                  </div>
                  {filterMine && <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                </button>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Categories</h3>
                  {selectedCategory && (
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="text-[9px] font-black uppercase text-rose-500 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 lg:grid lg:gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-2 text-[11px] sm:text-xs font-bold transition-all",
                        selectedCategory === category 
                          ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-100" 
                          : "text-gray-500 hover:bg-gray-50 bg-transparent border-2 border-transparent"
                      )}
                    >
                      <span>{category}</span>
                      {selectedCategory === category && <X size={14} className="ml-2" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-yellow-300 rounded-[2rem] p-6 shadow-lg rotate-1 border-b-4 border-yellow-500">
              <p className="text-xs font-black text-yellow-900 leading-relaxed uppercase tracking-tighter">
                Found a ID card?<br/>
                <span className="text-[10px] opacity-70">Drop it at the security desk.</span>
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {filteringSpecificUser && (
            <div className="mb-8 flex items-center justify-between rounded-2xl bg-indigo-50 p-6 border-2 border-indigo-100 shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-lg">
                    {userNameParam?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 leading-none mb-1">Viewing Reports For</p>
                    <h2 className="text-xl font-black text-indigo-900 tracking-tight">{userNameParam}</h2>
                  </div>
               </div>
               <button 
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.delete('filter');
                  p.delete('userId');
                  p.delete('userName');
                  setSearchParams(p);
                }}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-200 transition-all hover:bg-gray-50 hover:text-rose-500"
               >
                 <X size={14} />
                 Clear Filter
               </button>
            </div>
          )}

          <div className="mb-8 flex items-center bg-gray-50 p-1.5 rounded-2xl w-fit gap-1 border-2 border-indigo-50">
            <button 
              onClick={() => setActiveTab('items')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'items' ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Reports
            </button>
            <button 
              onClick={() => setActiveTab('directory')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'directory' ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Directory
            </button>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              {loading ? `Loading ${activeTab}...` : (
                <>Showing <span className="font-bold text-gray-900">{activeTab === 'items' ? filteredItems.length : filteredUsers.length}</span> {activeTab}</>
              )}
            </span>
          </div>

          {activeTab === 'directory' ? (
            <div className="grid gap-6 sm:grid-cols-2">
               {filteredUsers.map(u => (
                 <div key={u.id} className="bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 text-2xl font-black shadow-inner">
                         {u.avatarUrl ? (
                           <img src={u.avatarUrl} alt="" className="h-full w-full rounded-2xl object-cover" referrerPolicy="no-referrer" />
                         ) : u.name.charAt(0)}
                       </div>
                       <div>
                          <h3 className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">{u.name}</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                            <Hash size={10} className="text-indigo-400" />
                            {u.rollNo || "No Roll #"}
                          </p>
                       </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                       <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                          <Mail size={14} className="text-indigo-400" />
                          {u.email}
                       </div>
                       <div className="flex items-center gap-2 text-xs font-bold text-gray-500 italic">
                          <Phone size={14} className="text-indigo-400" />
                          {u.phone || "No Phone Listed"}
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t-2 border-indigo-50/50">
                       <div className="text-center bg-gray-50 px-3 py-2 rounded-xl">
                          <p className="text-lg font-black text-indigo-900">{u.reportsCount}</p>
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Reports</p>
                       </div>
                       <button 
                        onClick={() => {
                          const p = new URLSearchParams(searchParams);
                          p.set('filter', 'user');
                          p.set('userId', u.id);
                          p.set('userName', u.name);
                          setSearchParams(p);
                          setActiveTab('items');
                        }}
                        className="flex items-center gap-2 rounded-xl bg-indigo-900 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                       >
                         View Activity
                         <ExternalLink size={14} />
                       </button>
                    </div>
                 </div>
               ))}
               {filteredUsers.length === 0 && (
                 <div className="col-span-full py-20 text-center">
                    <p className="text-xl font-black text-gray-400 uppercase tracking-tighter">No users found matching your search</p>
                 </div>
               )}
            </div>
          ) : (
            <>
              {loading ? (
                 <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                   {[1, 2, 3, 4, 5, 6].map(i => (
                     <div key={i} className="h-[400px] animate-pulse rounded-2xl bg-gray-100"></div>
                   ))}
                 </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-gray-100 py-24 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                    <Search size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {filterMine ? "You haven't reported anything yet" : "No items found"}
                  </h3>
                  <p className="mt-2 text-gray-500">
                    {filterMine ? "Your active lost or found reports will appear here." : "Try adjusting your search or filters."}
                  </p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                      const p = new URLSearchParams(searchParams);
                      p.delete('filter');
                      p.delete('userId');
                      p.delete('userName');
                      setSearchParams(p);
                    }}
                    className="mt-6 font-bold text-indigo-600 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

