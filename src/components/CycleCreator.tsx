import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Image as ImageIcon, Video, Type, Send, Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { uploadToConvexStorage } from '../utils/imageUpload';

import { useAuth } from '../contexts/AuthContext';

interface CycleCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

type ComposerMode = 'text' | 'camera' | 'photo' | 'video';

export default function CycleCreator({ isOpen, onClose }: CycleCreatorProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<ComposerMode>('camera');
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const createCycle = useMutation(api.cycles.createCycle);
  const generateUploadUrl = useMutation(api.cycles.generateUploadUrl);

  const resetState = () => {
    setText('');
    setMediaFile(null);
    setMediaPreview(null);
    setMode('camera');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    // mode is already set by the button that triggered the input
  };

  const handlePublish = async () => {
    if (!user) return;
    if (mode === 'text' && !text.trim()) return;
    if (mode !== 'text' && !mediaFile) return;

    setIsUploading(true);

    try {
      let storageId: string | undefined;

      if (mode !== 'text' && mediaFile) {
        // Upload media to Convex
        storageId = await uploadToConvexStorage(
          mediaFile,
          () => generateUploadUrl(),
          { contentType: mediaFile.type }
        );
      }

      const contentType = mode !== 'text'
        ? (mediaFile!.type.startsWith('video/') ? 'video' : 'image')
        : 'text';

      await createCycle({
        authorType: 'user',
        contentType,
        text: text.trim() || undefined,
        mediaStorageId: storageId,
      });

      handleClose();
    } catch (err) {
      console.error('Failed to create cycle:', err);
      // Fallback simple alert, ideally use a toast in real app
      alert('Failed to publish cycle. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent absolute top-0 w-full z-10">
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
{(mediaPreview || (mode === 'text' && text.trim())) && (
          <button
            onClick={handlePublish}
            disabled={isUploading}
            className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2 rounded-full font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isUploading ? 'Publishing...' : 'Publish'}
          </button>
        )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center bg-zinc-900">
          {mode === 'text' ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening?"
              className="w-full max-w-md h-64 bg-transparent text-white text-3xl font-medium text-center focus:outline-none resize-none px-6"
              maxLength={200}
              autoFocus
            />
          ) : mediaPreview ? (
            <div className="w-full h-full flex items-center justify-center">
              {mediaFile?.type.startsWith('video/') ? (
                <video src={mediaPreview} controls className="max-w-full max-h-full object-contain" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
              )}
            </div>
          ) : null}
        </div>

        {/* Bottom Toolbar */}
        <div className="p-4 bg-zinc-950 flex justify-center gap-4">
          {/* Camera (environment) */}
          <button
            onClick={() => {
              setMode('camera');
              cameraInputRef.current?.click();
            }}
            className={`p-3 rounded-full ${mode === 'camera' ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            <Camera className="w-6 h-6" />
          </button>
          {/* Photo */}
          <button
            onClick={() => {
              setMode('photo');
              photoInputRef.current?.click();
            }}
            className={`p-3 rounded-full ${mode === 'photo' ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          {/* Video */}
          <button
            onClick={() => {
              setMode('video');
              videoInputRef.current?.click();
            }}
            className={`p-3 rounded-full ${mode === 'video' ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            <Video className="w-6 h-6" />
          </button>
          {/* Text */}
          <button
            onClick={() => setMode('text')}
            className={`p-3 rounded-full ${mode === 'text' ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            <Type className="w-6 h-6" />
          </button>
          {/* Hidden inputs for each capture type */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            className="hidden"
            onChange={onFileChange}
          />
          <input
            type="file"
            accept="image/*"
            ref={photoInputRef}
            className="hidden"
            onChange={onFileChange}
          />
          <input
            type="file"
            accept="video/*"
            ref={videoInputRef}
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
