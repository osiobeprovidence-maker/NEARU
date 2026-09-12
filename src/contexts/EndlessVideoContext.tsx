import React, { createContext, useContext, useState, useCallback } from 'react';
import EndlessVideoViewer from '../components/explore/EndlessVideoViewer';

interface EndlessVideoContextType {
  openVideo: (video: any, videoList?: any[]) => void;
  closeVideo: () => void;
  isOpen: boolean;
  activeVideo: any | null;
  videoList: any[];
}

const EndlessVideoContext = createContext<EndlessVideoContextType | undefined>(undefined);

export function EndlessVideoProvider({ children }: { children: React.ReactNode }) {
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [videoList, setVideoList] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openVideo = useCallback((video: any, list?: any[]) => {
    if (!video) return;

    // Normalize video object structure if needed
    const normalizedVideo = {
      _id: video._id || video.id || `v-${Date.now()}`,
      title: video.title || video.caption || video.description || 'Community Video',
      description: video.description || video.text || '',
      mediaUrl: video.mediaUrl || video.mediaUrls?.[0] || video.videoUrl || '',
      mediaUrls: video.mediaUrls || [video.mediaUrl || video.videoUrl],
      likesCount: video.likesCount || video.likes || 0,
      commentsCount: video.commentsCount || video.comments || 0,
      isLiked: !!(video.isLiked || video.likedByMe),
      locationLabel: video.locationLabel || video.location || '',
      interest: video.interest || video.hashtags?.[0] || '',
      creator: video.creator || video.author || {
        _id: video.userId || 'creator',
        name: video.userName || 'Creator',
        username: video.username || 'user',
        avatar: video.userAvatar || video.avatar,
      },
    };

    let fullList: any[] = [];
    if (list && list.length > 0) {
      fullList = list.map((v) => ({
        _id: v._id || v.id || `v-${Math.random()}`,
        title: v.title || v.caption || v.description || 'Community Video',
        description: v.description || v.text || '',
        mediaUrl: v.mediaUrl || v.mediaUrls?.[0] || v.videoUrl || '',
        mediaUrls: v.mediaUrls || [v.mediaUrl || v.videoUrl],
        likesCount: v.likesCount || v.likes || 0,
        commentsCount: v.commentsCount || v.comments || 0,
        isLiked: !!(v.isLiked || v.likedByMe),
        locationLabel: v.locationLabel || v.location || '',
        interest: v.interest || v.hashtags?.[0] || '',
        creator: v.creator || v.author || {
          _id: v.userId || 'creator',
          name: v.userName || 'Creator',
          username: v.username || 'user',
          avatar: v.userAvatar || v.avatar,
        },
      }));
    } else {
      fullList = [normalizedVideo];
    }

    // Ensure the clicked video is in the list
    const exists = fullList.some((v) => v._id === normalizedVideo._id);
    if (!exists) {
      fullList.unshift(normalizedVideo);
    }

    setVideoList(fullList);
    setActiveVideo(normalizedVideo);
    setIsOpen(true);
  }, []);

  const closeVideo = useCallback(() => {
    setIsOpen(false);
    setActiveVideo(null);
  }, []);

  return (
    <EndlessVideoContext.Provider
      value={{
        openVideo,
        closeVideo,
        isOpen,
        activeVideo,
        videoList,
      }}
    >
      {children}

      {isOpen && activeVideo && videoList.length > 0 && (
        <EndlessVideoViewer
          videos={videoList}
          initialVideoId={activeVideo._id}
          isOpen={isOpen}
          onClose={closeVideo}
        />
      )}
    </EndlessVideoContext.Provider>
  );
}

export function useEndlessVideo() {
  const context = useContext(EndlessVideoContext);
  if (!context) {
    throw new Error('useEndlessVideo must be used within an EndlessVideoProvider');
  }
  return context;
}
