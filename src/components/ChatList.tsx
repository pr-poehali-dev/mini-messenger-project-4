import { useState, useEffect } from 'react';
import { Chat, User } from '@/types';
import { Avatar } from './Sidebar';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

interface Props {
  token: string;
  currentUser: User;
  selectedChatId: number | null;
  onSelectChat: (chat: Chat) => void;
  title?: string;
  filterType?: 'direct' | 'group';
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  return date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

export default function ChatList({ token, currentUser, selectedChatId, onSelectChat, title = 'Чаты', filterType }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchChats() {
    try {
      const data = await api.chats.list(token);
      let list = data.chats || [];
      if (filterType) list = list.filter((c: Chat) => c.type === filterType);
      setChats(list);
    } finally {
      setLoading(false);
    }
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    await api.chats.create(token, { type: 'group', name: newGroupName });
    setNewGroupName('');
    setShowNewGroup(false);
    setCreating(false);
    fetchChats();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {filterType === 'group' && (
          <button
            onClick={() => setShowNewGroup(!showNewGroup)}
            className="w-8 h-8 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all"
          >
            <Icon name="Plus" size={16} />
          </button>
        )}
      </div>

      {showNewGroup && (
        <form onSubmit={createGroup} className="mx-4 mb-3 flex gap-2 animate-fade-in">
          <input
            type="text"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="Название группы"
            className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <button
            type="submit"
            disabled={creating}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
          >
            {creating ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'OK'}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto px-2">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <Icon name="Loader2" size={20} className="animate-spin" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
            <Icon name="MessageSquare" size={28} />
            <span className="text-sm">Нет чатов</span>
          </div>
        ) : (
          chats.map(chat => {
            const name = chat.type === 'direct'
              ? (chat.other_user?.display_name || chat.name)
              : chat.name;
            const isActive = selectedChatId === chat.id;
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-left transition-all ${
                  isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary'
                }`}
              >
                <div className="relative">
                  <Avatar name={name} />
                  {chat.type === 'direct' && chat.other_user?.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {name}
                    </span>
                    {chat.last_message && (
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {timeAgo(chat.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">
                      {chat.last_message
                        ? (chat.last_message.sender_id === currentUser.id ? 'Вы: ' : '') + chat.last_message.content
                        : chat.type === 'group' ? `${chat.members_count || 0} участников` : 'Начните диалог'}
                    </span>
                    {chat.unread_count > 0 && (
                      <span className="ml-2 shrink-0 bg-primary text-primary-foreground text-xs font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}