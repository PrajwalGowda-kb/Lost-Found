/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, Calendar, Tag, X, User, MessageSquare, Send, CheckCircle2, Trash2, Phone, Hash, ShieldCheck, RefreshCw } from 'lucide-react';
import { LostFoundItem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import ItemDetailsModal from './ItemDetailsModal';

interface ItemCardProps {
  item: LostFoundItem;
  key?: string | number;
}

export default function ItemCard({ item }: ItemCardProps) {
  const { user, isAdmin } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLost = item.type === 'lost';

  const handleResolve = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const actionText = isLost ? "mark this lost item as FOUND" : "mark this found item as RETURNED";
    if (!window.confirm(`Are you sure you want to ${actionText}? This will remove it from the browse page.`)) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;
      
      alert(isLost ? "Item marked as found!" : "Item marked as returned!");
      setShowDetails(false);
    } catch (err) {
      console.error("Resolve error:", err);
      alert("Failed to update status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className={cn(
          "group overflow-hidden rounded-[2.5rem] bg-white p-5 shadow-xl transition-all border-b-[6px]",
          isLost ? "border-rose-500" : "border-indigo-600"
        )}
      >
        <div 
          onClick={() => setShowDetails(true)}
          className="relative aspect-[4/3] overflow-hidden rounded-3xl mb-4 cursor-pointer"
        >
          <img 
            src={item.imageUrl || 'https://picsum.photos/seed/placeholder/800/600'} 
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="rounded-full bg-white/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
              View Details
            </span>
          </div>
        </div>
        
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
              {item.category}
            </span>
            <span className="text-[10px] font-bold text-gray-400 italic">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <h3 className="mb-2 line-clamp-1 text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight">
            {item.title}
          </h3>
          
          <div className="mb-4 flex items-center justify-between">
            <Link 
              to={`/browse?filter=user&userId=${item.reporterId}&userName=${encodeURIComponent(item.reporterName)}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
               <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-[10px] font-black text-indigo-600 uppercase">
                 {item.reporterAvatarUrl ? (
                   <img src={item.reporterAvatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   item.reporterName.charAt(0)
                 )}
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                 {item.reporterName}
               </span>
            </Link>

            {(isAdmin || (user?.id === item.reporterId)) && (
               <button 
                onClick={handleResolve}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
               >
                 {isSubmitting ? <RefreshCw className="h-2 w-2 animate-spin" /> : <ShieldCheck size={10} />}
                 {isLost ? "Found" : "Returned"}
               </button>
            )}
          </div>
          
          <p className="mb-4 line-clamp-2 text-sm font-medium leading-relaxed text-gray-500">
            {item.description}
          </p>
          
          <div className="space-y-2 border-t-2 border-indigo-50 pt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <MapPin size={14} className="text-indigo-600" />
              <span className="line-clamp-1">{item.location}</span>
            </div>
            <div className="flex items-center justify-between mt-4">
               <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Calendar size={14} className="text-indigo-600" />
                  <span>{item.date}</span>
               </div>
               <button 
                 onClick={() => setShowDetails(true)}
                 className="text-indigo-600 font-black text-sm uppercase tracking-tighter hover:translate-x-1 transition-transform"
               >
                  View Report →
               </button>
            </div>
          </div>
        </div>
      </motion.div>

      {showDetails && (
        <ItemDetailsModal 
          item={item} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </>
  );
}
