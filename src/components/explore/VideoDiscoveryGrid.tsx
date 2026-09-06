import React, { useState } from 'react';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import { Play } from 'lucide-react';

interface VideoDiscoveryGridProps {
  videos: any[];
  layout?: 'grid' | 'carousel';
  columns?: 2 | 3 | 4;
}

export default function VideoDiscoveryGrid({
  videos,
  layout = 'grid',
  columns = 3,
}: VideoDiscoveryGridProps) {
  const [activeVideo, setActiveVideo] = useState<any | null>(null);

  if (!videos || videos.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center bg-zinc-50/80 rounded-3xl border border-zinc-200/60">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <Play className="w-6 h-6 ml-0.5" />
        </div>
        <p className="text-sm sm:text-base font-bold text-zinc-900 mb-1">
          No videos available yet
        </p>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Be the first to share a video on Lalao! Click Create below to share moments with your community.
        </p>
      </div>
    );
  }

  // Carousel layout (Horizontal scroll on Explore overview)
  if (layout === 'carousel') {
    return (
      <>
        <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-1 px-0.5 overscroll-x-contain">
          {videos.slice(0, 8).map((video) => (
            <div key={video._id} className="w-40 sm:w-48 shrink-0">
              <VideoCard video={video} onClick={() => setActiveVideo(video)} />
            </div>
          ))}
        </div>

        {activeVideo && (
          <VideoModal
            video={activeVideo}
            isOpen={!!activeVideo}
            onClose={() => setActiveVideo(null)}
          />
        )}
      </>
    );
  }

  // Full Grid layout (Videos tab)
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        {videos.map((video) => (
          <VideoCard
            key={video._id}
            video={video}
            onClick={() => setActiveVideo(video)}
          />
        ))}
      </div>

      {activeVideo && (
        <VideoModal
          video={activeVideo}
          isOpen={!!activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </>
  );
}
