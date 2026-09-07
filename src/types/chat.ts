export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

export interface ChatParticipant {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
  isNINVerified?: boolean;
  badges?: string[];
}

export interface ChatAttachment {
  type: 'photo' | 'camera' | 'file';
  file?: File;
  previewUrl?: string;
  name?: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId?: string;
  text: string;
  timestamp: number;
  status: MessageDeliveryStatus;
  readByIds?: string[];
  audioUrl?: string;
  audioDuration?: number;
  attachmentUrl?: string;
  attachmentType?: 'photo' | 'camera' | 'file' | 'audio';
  isOptimistic?: boolean;
}

export interface ChatConversation {
  id: string;
  type: 'direct' | 'rally';
  participantIds: string[];
  lastMessage?: {
    senderId: string;
    text: string;
    timestamp: number;
  };
  otherParticipant?: ChatParticipant | null;
  rallyTitle?: string;
  myUnread?: number;
}
