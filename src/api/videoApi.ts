import { api } from './api';

export interface CreatorInfo {
  id: string;
  username: string;
  avatarUrl: string;
  isFollowed?: boolean;
}

export interface VideoItem {
  id: string;
  postId: string;
  videoUrl: string;
  thumbnailUrl: string;
  creator: CreatorInfo;
  caption: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface VideoFeedResponse {
  items: VideoItem[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Fetch a page of videos using cursor pagination.
 * @param cursor Optional cursor for the next page.
 */
export const fetchVideoFeed = async (
  cursor?: string
): Promise<VideoFeedResponse> => {
  const params = cursor ? { cursor } : {};
  const response = await api.get<VideoFeedResponse>('/videos/feed', { params });
  return response.data;
};
