import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import Avatar from './Avatar';
import { cn } from '../lib/utils';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface CycleViewerProps {
  isOpen: boolean;
  onClose: () => void;
  cyclesGroup: {
    key: string;
    name: string;
    avatarUrl?: string;
    authorId?: string;
    pageId?: string;
    cycles: any[];
  } | null;
}

export default function CycleViewer({ isOpen, onClose, cyclesGroup }: CycleViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const markViewed = useMutation(api.cycles.markCycleViewed);

  // Default duration for non-video cycles is 5 seconds
  const CYCLE_DURATION_MS = 5000;

  useEffect(() => {
    if (isOpen && cyclesGroup && cyclesGroup.cycles.length > 0) {
      setCurrentIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, cyclesGroup]);

  useEffect(() => {
    if (!isOpen || !cyclesGroup || cyclesGroup.cycles.length === 0) return;

    const currentCycle = cyclesGroup.cycles[currentIndex];
    
    // Mark as viewed
    markViewed({ cycleId: currentCycle._id as Id<"cycles"> });

    let animationFrame: number;
    let startTime: number | null = null;
    let expectedDuration = CYCLE_DURATION_MS;

    const isVideo = currentCycle.contentType === 'video';

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      if (isPaused) {
        startTime += timestamp - startTime; // Shift start time to pause
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      if (isVideo && videoRef.current) {
        // Tie progress to video playback if possible
        expectedDuration = (videoRef.current.duration || 5) * 1000;
        const currentProg = (videoRef.current.currentTime / (videoRef.current.duration || 5)) * 100;
        setProgress(currentProg);
        
        if (videoRef.current.ended) {
          handleNext();
          return;
        }
      } else {
        const elapsed = timestamp - startTime;
        const currentProg = (elapsed / expectedDuration) * 100;
        setProgress(Math.min(currentProg, 100));

        if (elapsed >= expectedDuration) {
          handleNext();
          return;
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [currentIndex, isPaused, isOpen, cyclesGroup]);

  const handleNext = () => {
    if (!cyclesGroup) return;
    if (currentIndex < cyclesGroup.cycles.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handlePointerDown = () => setIsPaused(true);
  const handlePointerUp = () => setIsPaused(false);

  if (!isOpen || !cyclesGroup) return null;

  const currentCycle = cyclesGroup.cycles[currentIndex];
  if (!currentCycle) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden"
      >
        {/* Progress Bars */}
        <div className="absolute top-0 inset-x-0 pt-safe-top z-20 flex gap-1 px-2 py-2">
          {cyclesGroup.cycles.map((c, i) => (
            <div key={c._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all ease-linear"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 inset-x-0 pt-safe-top mt-4 px-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <Avatar src={cyclesGroup.avatarUrl} name={cyclesGroup.name} size="sm" className="border-2 border-primary" />
            <div>
              <p className="font-bold text-sm leading-tight drop-shadow-md">{cyclesGroup.name}</p>
              <p className="text-xs text-white/70 drop-shadow-md">
                {new Date(currentCycle.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div 
          className="flex-1 relative w-full h-full flex items-center justify-center"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Navigation overlay zones */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev} />
          <div className="absolute inset-y-0 right-0 w-2/3 z-10" onClick={handleNext} />

          {currentCycle.contentType === 'text' && (
            <div className={cn(
              "w-full h-full flex items-center justify-center p-8",
              "bg-gradient-to-br from-indigo-900 to-primary"
            )}>
              <p className="text-3xl font-bold text-center text-white drop-shadow-lg leading-tight break-words max-w-full">
                {currentCycle.text}
              </p>
            </div>
          )}

          {currentCycle.contentType === 'image' && currentCycle.mediaUrl && (
            <img 
              src={currentCycle.mediaUrl} 
              alt="Cycle" 
              className="w-full h-full object-cover"
            />
          )}

          {currentCycle.contentType === 'video' && currentCycle.mediaUrl && (
            <video 
              ref={videoRef}
              src={currentCycle.mediaUrl} 
              autoPlay
              playsInline
              muted={false} // Ideally unmute based on user interaction, but this is a viewer
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
