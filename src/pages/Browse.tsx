/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { CATEGORIES, LostFoundItem } from '../types';
import { cn } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../App';

export default function Browse() {
  const { user } = useAuth();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');

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
            reporterAvatarUrl: item.reporter_avatar_url,
            createdAt: item.created_at
          })) as LostFoundItem[];
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
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Explore Items</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-500">Search through everything reported on campus.</p>
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
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              {loading ? "Loading items..." : (
                <>Showing <span className="font-bold text-gray-900">{filteredItems.length}</span> items</>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                <SlidersHorizontal size={14} />
                <span>Sort: Newest</span>
              </button>
            </div>
          </div>

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
              <h3 className="text-xl font-bold text-gray-900">No items found</h3>
              <p className="mt-2 text-gray-500">Try adjusting your search or filters.</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="mt-6 font-bold text-indigo-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

