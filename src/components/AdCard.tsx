import React from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';

interface AdCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  linkUrl?: string;
  ctaText?: string;
  brandName?: string;
  brandLogoUrl?: string;
}

export default function AdCard({ title, description, imageUrl, mediaType, linkUrl, ctaText = 'Learn More', brandName, brandLogoUrl }: AdCardProps) {
  const isVideo = mediaType === 'video' || (imageUrl && (imageUrl.endsWith('.mp4') || imageUrl.endsWith('.webm') || imageUrl.endsWith('.mov')));

  return (
    <div className="bg-white overflow-hidden flex flex-col sm:flex-row relative">
      <div className="absolute top-4 left-4 z-10 bg-zinc-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
        Ad
      </div>

      {imageUrl ? (
        <div className="h-48 sm:h-auto sm:w-[40%] bg-zinc-900 relative overflow-hidden border-b sm:border-b-0 sm:border-r border-zinc-100 flex items-center justify-center">
          {isVideo ? (
            <video src={imageUrl} controls className="w-full h-full object-cover" />
          ) : (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          )}
        </div>
      ) : (
        <div className="h-48 sm:h-auto sm:w-[40%] bg-zinc-50 relative overflow-hidden flex items-center justify-center border-b sm:border-b-0 sm:border-r border-zinc-100">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-purple-50/80" />
          <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center text-indigo-500">
              <Megaphone className="w-10 h-10" />
            </div>
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center bg-white relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl" />

        <div className="relative z-10">
          {brandName && (
            <div className="flex items-center gap-2 mb-3">
              {brandLogoUrl ? (
                <img src={brandLogoUrl} alt={brandName} className="w-5 h-5 rounded object-cover" />
              ) : (
                <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                  {brandName.charAt(0)}
                </div>
              )}
              <span className="text-xs font-black text-zinc-900 tracking-tight">{brandName}</span>
            </div>
          )}

          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight mb-2 leading-tight">
            {title}
          </h3>

          <p className="text-sm text-zinc-500 font-medium mb-6 leading-relaxed max-w-sm">
            {description}
          </p>

          <a
            href={linkUrl || '#'}
            target={linkUrl ? '_blank' : undefined}
            rel={linkUrl ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-md shadow-zinc-200"
          >
            {ctaText}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
