/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, Calendar, Tag, X, User, MessageSquare, Send, CheckCircle2, Trash2, Phone, Hash, ShieldCheck } from 'lucide-react';
import { LostFoundItem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';

interface ItemCardProps {
  item: LostFoundItem;
  key?: string | number;
}

export default function ItemCard({ item }: ItemCardProps) {
  const { user, isAdmin } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isLost = item.type === 'lost';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Admin Action: Are you sure you want to PERMANENTLY delete this report?")) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;
      
      // The real-time subscription in parent pages (Browse/Home) will handle the UI removal
      alert("Report deleted successfully.");
      setShowDetails(false);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete report.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setShowDetails(false);
      }, 2000);
    }, 1500);
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
          onClick={() => setShowLightbox(true)}
          className="relative aspect-[4/3] overflow-hidden rounded-3xl mb-4 cursor-zoom-in"
        >
          <img 
            src={item.imageUrl || 'https://picsum.photos/seed/placeholder/800/600'} 
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          {isAdmin && (
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-rose-500 shadow-xl backdrop-blur-md transition-all hover:bg-rose-600 hover:text-white"
                title="Admin Delete"
              >
                <Trash2 size={18} className={isDeleting ? "animate-pulse" : ""} />
              </button>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="rounded-full bg-white/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
              Tap to Expand
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
          
          <div className="mb-4 flex items-center gap-2">
             <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-[10px] font-black text-indigo-600 uppercase">
               {item.reporterAvatarUrl ? (
                 <img src={item.reporterAvatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 item.reporterName.charAt(0)
               )}
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
               Reported by {item.reporterName}
             </span>
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

      {/* Lightbox Modal */}
      <AnimatePresence>
        {showLightbox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLightbox(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div
              layoutId={item.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-full max-w-5xl overflow-hidden rounded-[3rem] shadow-2xl"
            >
              <img 
                src={item.imageUrl || 'https://picsum.photos/seed/placeholder/800/600'} 
                alt={item.title}
                className="max-h-[85vh] w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setShowLightbox(false)}
                className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </motion.div>
          </div>
        )}

        {/* Details & Contact Modal */}
        {showDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="absolute inset-0 bg-indigo-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-[3rem] bg-white shadow-2xl dark:bg-gray-900"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Visual Side */}
                <div 
                  onClick={() => {
                    setShowDetails(false);
                    setShowLightbox(true);
                  }}
                  className="relative h-64 w-full cursor-zoom-in lg:h-auto lg:w-1/2"
                >
                  <img 
                    src={item.imageUrl || 'https://picsum.photos/seed/placeholder/800/600'} 
                    alt={item.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute bottom-8 left-8">
                    <span className={cn(
                      "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white",
                      isLost ? "bg-rose-500" : "bg-emerald-500"
                    )}>
                      {isLost ? "Lost Item" : "Found Item"}
                    </span>
                    <h2 className="mt-2 text-3xl font-black text-white uppercase tracking-tighter leading-none">
                      {item.title}
                    </h2>
                  </div>
                </div>

                {/* Content Side */}
                <div className="flex flex-1 flex-col p-6 sm:p-8 lg:p-12">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                     <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-indigo-50 text-indigo-600 font-black">
                          {item.reporterAvatarUrl ? (
                            <img src={item.reporterAvatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            item.reporterName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Reporter</p>
                          <p className="text-sm font-bold text-gray-900">{item.reporterName}</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setShowDetails(false)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100"
                      >
                        <X size={20} strokeWidth={3} />
                      </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Location</p>
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
                        <MapPin size={16} className="text-indigo-600 shrink-0" />
                        <span className="line-clamp-1">{item.location}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Date Reported</p>
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
                        <Calendar size={16} className="text-indigo-600 shrink-0" />
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Roll Number</p>
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700">
                        <Hash size={16} className="text-indigo-600 shrink-0" />
                        <span className="line-clamp-1">{item.reporterRollNo || 'Not Provided'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Contact Number</p>
                      <a href={`tel:${item.reporterPhone}`} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                        <Phone size={16} className="text-indigo-600 shrink-0" />
                        <span>{item.reporterPhone || 'Not Provided'}</span>
                      </a>
                    </div>
                  </div>

                  <div className="mb-8 sm:mb-10 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Item Description</p>
                    <p className="text-sm font-medium leading-relaxed text-gray-500 overflow-y-auto max-h-[150px] lg:max-h-none">
                      {item.description}
                    </p>
                  </div>

                  {/* Owner/Admin Controls */}
                  {(isAdmin || (user?.id === item.reporterId)) && (
                    <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-between">
                       <div className="hidden sm:block">
                          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Mark as Resolved?</p>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1 italic">Item found or returned</p>
                       </div>
                       <button 
                        onClick={handleDelete}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                       >
                         <ShieldCheck size={14} />
                         Mark Resolved
                       </button>
                    </div>
                  )}

                  <div className="mt-auto rounded-[2rem] bg-indigo-50/50 p-6 sm:p-8 border-2 border-indigo-100">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-600">
                      <MessageSquare size={16} />
                      {isLost ? "Found this item?" : "Is this your item?"}
                    </h4>
                    
                    {isSent ? (
                      <div className="flex flex-col items-center py-4 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <CheckCircle2 size={24} />
                        </div>
                        <p className="text-sm font-bold text-emerald-600">Message sent to {item.reporterName}!</p>
                      </div>
                    ) : (
                      <form onSubmit={handleContact} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <input 
                            required
                            type="text" 
                            placeholder="YOUR NAME" 
                            className="rounded-xl border-2 border-white bg-white/50 px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-indigo-600 focus:outline-none"
                          />
                           <input 
                            required
                            type="email" 
                            placeholder="CAMPUS EMAIL" 
                            className="rounded-xl border-2 border-white bg-white/50 px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-indigo-600 focus:outline-none"
                          />
                        </div>
                        <textarea 
                          required
                          placeholder="WRITE YOUR MESSAGE..." 
                          className="h-24 w-full rounded-xl border-2 border-white bg-white/50 p-4 text-xs font-bold uppercase tracking-widest focus:border-indigo-600 focus:outline-none"
                        ></textarea>
                        <button 
                          disabled={isSubmitting}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-black text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-tighter"
                        >
                          {isSubmitting ? "Sending..." : (
                            <>
                              <Send size={16} />
                              Send Notification
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
