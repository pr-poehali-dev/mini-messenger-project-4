export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  is_online: boolean;
  last_seen?: string;
  created_at: string;
}

export interface Chat {
  id: number;
  type: 'direct' | 'group';
  name: string;
  avatar_url?: string;
  last_message?: Message;
  unread_count: number;
  members_count?: number;
  created_at: string;
  other_user?: User;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  sender?: User;
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  is_read: boolean;
}

export interface Contact {
  id: number;
  user: User;
  created_at: string;
}

export type ActiveSection = 'chats' | 'contacts' | 'groups' | 'search' | 'profile' | 'settings';
