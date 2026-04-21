/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Calendar, Tag, AlertCircle, CheckCircle2, Upload, X as CloseIcon, Phone, User as UserIcon, Hash, Video } from 'lucide-react';
import { CATEGORIES, LostFoundItem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, signInWithGoogle, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../App';

export default function Report() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    date: '',
    type: 'lost' as 'lost' | 'found',
    reporterPhone: '',
    reporterRollNo: ''
  });

  // Camera logic
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUrl);
        
        // Convert dataUrl to File object
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
            setImageFile(file);
          });
        
        stopCamera();
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be under 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    
    if (!isSupabaseConfigured) {
      alert("Submission failed: Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Settings > Secrets.");
      setIsSubmitting(false);
      return;
    }

    setSubmissionStatus("Preparing...");
    setUploadProgress(0);

    try {
      let imageUrl = '';
      
      if (imageFile) {
        setSubmissionStatus("Uploading photo...");
        const fileName = `${Date.now()}_${imageFile.name}`;
        const filePath = `items/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('items')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('items')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }

      setSubmissionStatus("Saving report...");
      const { error: insertError } = await supabase
        .from('items')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          date: formData.date,
          type: formData.type,
          image_url: imageUrl || null,
          reporter_id: user.id,
          reporter_name: user.user_metadata?.full_name || 'Anonymous',
          reporter_email: user.email || 'No email',
          reporter_avatar_url: user.user_metadata?.avatar_url || null,
          reporter_phone: formData.reporterPhone || null,
          reporter_roll_no: formData.reporterRollNo || null
        });

      if (insertError) throw insertError;
      
      setIsSuccess(true);
    } catch (error) {
      console.error("Submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      alert(`Failed to report item: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      setSubmissionStatus(null);
      setUploadProgress(0);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center p-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-indigo-600 text-white shadow-xl">
          <AlertCircle size={40} strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Sign in required</h1>
        <p className="mt-4 font-medium text-gray-500">
          You need to be signed in to report a lost or found item.
        </p>
        <button 
          onClick={() => signInWithGoogle()}
          className="mt-10 rounded-3xl bg-indigo-600 px-10 py-5 font-black text-white shadow-xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter"
        >
          Sign in with student account
        </button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
        >
          <CheckCircle2 size={48} strokeWidth={3} />
        </motion.div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
          Successfully Published!
        </h1>
        <p className="mt-4 max-w-md font-medium text-gray-500">
          Your report is now live on the campus network. We'll notify you if we find any matches.
        </p>
        <div className="mt-10 flex gap-4">
          <button 
            onClick={() => setIsSuccess(false)}
            className="rounded-2xl bg-indigo-600 px-8 py-3 font-black text-white shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter"
          >
            Report Another
          </button>
          <Link to="/" className="rounded-2xl border-2 border-indigo-100 bg-white px-8 py-3 font-black text-gray-600 transition-all hover:bg-gray-50 active:scale-95 uppercase tracking-tighter">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase">Report an Item</h1>
        <p className="mt-2 font-bold text-indigo-400 text-lg uppercase tracking-widest leading-none">Help the community reunite.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-20 grid gap-8">
        {/* Type Toggle */}
        <div className="flex rounded-[2.5rem] bg-indigo-100 p-2 shadow-inner">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'lost' }))}
            className={cn(
              "flex-1 rounded-[2rem] py-4 text-sm font-black uppercase tracking-widest transition-all",
              formData.type === 'lost' ? "bg-rose-500 text-white shadow-xl" : "text-indigo-400 hover:text-indigo-600"
            )}
          >
            I Lost Something
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'found' }))}
            className={cn(
              "flex-1 rounded-[2rem] py-4 text-sm font-black uppercase tracking-widest transition-all",
              formData.type === 'found' ? "bg-emerald-500 text-white shadow-xl" : "text-indigo-400 hover:text-indigo-600"
            )}
          >
            I Found Something
          </button>
        </div>

        <div className="grid gap-6 rounded-[2.5rem] sm:rounded-[3rem] border-2 border-indigo-100 bg-white p-5 sm:p-8 md:p-12 shadow-2xl shadow-indigo-100">
          {/* Basic Info */}
          <div className="grid gap-6">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-indigo-400">Item Title</label>
              <input 
                required
                type="text" 
                placeholder="e.g., Blue Water Bottle..."
                className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none text-sm sm:text-base"
                value={formData.title}
                onChange={e => setFormData(prev => ({...prev, title: e.target.value}))}
              />
            </div>
            
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-indigo-400">Description</label>
              <textarea 
                required
                rows={4}
                placeholder="Describe the item in detail..."
                className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none text-sm sm:text-base"
                value={formData.description}
                onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-indigo-400">Category</label>
              <div className="relative">
                <Tag className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
                <select 
                  required
                  className="w-full appearance-none rounded-2xl border-2 border-indigo-50 bg-gray-50 py-3 sm:py-4 pl-14 pr-4 font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none text-sm sm:text-base"
                  value={formData.category}
                  onChange={e => setFormData(prev => ({...prev, category: e.target.value}))}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-indigo-400">Date {formData.type === 'lost' ? 'Lost' : 'Found'}</label>
              <div className="relative">
                <Calendar className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
                <input 
                  required
                  type="date" 
                  className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-3 sm:py-4 pl-14 pr-4 font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none text-sm sm:text-base"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({...prev, date: e.target.value}))}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-indigo-400">Location</label>
            <div className="relative">
              <MapPin className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
              <input 
                required
                type="text" 
                placeholder="e.g., Library 2nd Floor..."
                className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-3 sm:py-4 pl-14 pr-4 font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none text-sm sm:text-base"
                value={formData.location}
                onChange={e => setFormData(prev => ({...prev, location: e.target.value}))}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-indigo-400">Reporter Name</label>
              <div className="relative">
                <UserIcon className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
                <input 
                  required
                  type="text" 
                  placeholder="Your Name"
                  className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-3 sm:py-4 pl-14 pr-4 font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none text-sm sm:text-base opacity-70"
                  value={user.user_metadata?.full_name || ''}
                  readOnly
                />
              </div>
            </div>
             <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-indigo-400">Roll Number</label>
              <div className="relative">
                <Hash className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
                <input 
                  required
                  type="text" 
                  placeholder="e.g., 22BEC123"
                  className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-3 sm:py-4 pl-14 pr-4 font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none text-sm sm:text-base"
                  value={formData.reporterRollNo}
                  onChange={e => setFormData(prev => ({...prev, reporterRollNo: e.target.value}))}
                />
              </div>
            </div>
          </div>

          <div>
             <label className="mb-2 block text-xs font-black uppercase tracking-widest text-indigo-400">Phone Number</label>
             <div className="relative">
                <Phone className="absolute top-1/2 left-5 -translate-y-1/2 text-indigo-400" size={18} strokeWidth={3} />
                <input 
                  required
                  type="tel" 
                  placeholder="e.g., +91 98765 43210"
                  className="w-full rounded-2xl border-2 border-indigo-50 bg-gray-50 py-3 sm:py-4 pl-14 pr-4 font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none text-sm sm:text-base"
                  value={formData.reporterPhone}
                  onChange={e => setFormData(prev => ({...prev, reporterPhone: e.target.value}))}
                />
             </div>
          </div>

          <div>
            <label className="mb-4 block text-xs font-black uppercase tracking-widest text-indigo-400">Photo / Document</label>
            
            <AnimatePresence>
              {isCameraActive && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden rounded-[2.5rem] border-4 border-indigo-600"
                >
                  <div className="relative aspect-video w-full bg-black">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={takePhoto}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-indigo-600 shadow-2xl transition-transform hover:scale-110 active:scale-90"
                      >
                        <div className="h-12 w-12 rounded-full border-4 border-indigo-600"></div>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="flex h-16 items-center rounded-2xl bg-rose-500 px-6 font-black text-white shadow-xl transition-all hover:bg-rose-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <canvas ref={canvasRef} className="hidden" />

            <div 
              className={cn(
                "relative flex min-h-[160px] flex-col items-center justify-center rounded-[2rem] border-4 border-dashed transition-all",
                imagePreview ? "border-indigo-100 bg-indigo-50/30" : "border-indigo-50 bg-gray-50/50 hover:border-indigo-200 hover:bg-gray-50"
              )}
            >
              {imagePreview ? (
                <div className="relative h-full w-full p-4">
                  <img src={imagePreview} alt="Preview" className="mx-auto max-h-[300px] rounded-2xl object-cover shadow-lg" />
                  <button 
                    type="button"
                    onClick={removeImage}
                    className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-90"
                  >
                    <CloseIcon size={16} strokeWidth={3} />
                  </button>
                  {isSubmitting && uploadProgress > 0 && (
                    <div className="absolute inset-x-4 bottom-4">
                      <div className="h-4 w-full overflow-hidden rounded-full bg-white/20 backdrop-blur-md">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          className="h-full bg-indigo-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex w-full flex-col gap-4 p-8 sm:flex-row">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[2rem] bg-indigo-600 p-8 text-white shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white">
                      <Video size={28} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">Take Picture</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[2rem] bg-white border-4 border-indigo-50 p-8 text-indigo-400 shadow-xl transition-all hover:scale-105 hover:border-indigo-100 hover:text-indigo-600 active:scale-95"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Upload size={28} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">Upload File</span>
                  </button>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-indigo-50 p-6 text-xs font-bold text-indigo-600 border-2 border-indigo-100">
            <AlertCircle size={24} strokeWidth={3} className="flex-shrink-0" />
            <p className="uppercase tracking-widest leading-loose text-[10px]">By posting, you agree to our community guidelines. Never share sensitive personal info in the description.</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={cn(
               "flex h-20 w-full items-center justify-center rounded-3xl text-xl font-black text-white shadow-2xl transition-all active:scale-[0.98] uppercase tracking-tighter",
               formData.type === 'lost' ? "bg-rose-500 shadow-rose-200" : "bg-emerald-500 shadow-emerald-200",
               isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02]"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                <span className="text-sm font-black animate-pulse uppercase tracking-widest">{submissionStatus}</span>
              </div>
            ) : (
              `Post ${formData.type === 'lost' ? 'Lost' : 'Found'} Item`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


