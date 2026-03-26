import { useState, useEffect, useRef } from 'react';
import { Chat, Message, User } from '@/types';
import { Avatar } from './Sidebar';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

interface Props {
  chat: Chat;
  token: string;
  currentUser: User;
}

export default function ChatWindow({ chat, token, currentUser }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chatName = chat.type === 'direct'
    ? (chat.other_user?.display_name || chat.name)
    : chat.name;

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [chat.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    const data = await api.messages.list(token, chat.id);
    if (data.messages) setMessages(data.messages);
    setLoading(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    await api.messages.send(token, chat.id, content);
    setSending(false);
    fetchMessages();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as React.FormEvent);
    }
  }

  function groupByDate(msgs: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach(msg => {
      const d = new Date(msg.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long' });
      const last = groups[groups.length - 1];
      if (last && last.date === d) last.messages.push(msg);
      else groups.push({ date: d, messages: [msg] });
    });
    return groups;
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }

  const groups = groupByDate(messages);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-card">
        <div className="relative">
          <Avatar name={chatName} />
          {chat.type === 'direct' && chat.other_user?.is_online && (
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
          )}
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm">{chatName}</div>
          <div className="text-xs text-muted-foreground">
            {chat.type === 'direct'
              ? chat.other_user?.is_online ? 'онлайн' : 'был(а) недавно'
              : `${chat.members_count || 0} участников`}
          </div>
        </div>
        <div className="ml-auto flex gap-1">
          <button className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <Icon name="Phone" size={16} />
          </button>
          <button className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <Icon name="Search" size={16} />
          </button>
          <button className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <Icon name="MoreVertical" size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Icon name="Loader2" size={20} className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Icon name="MessageSquare" size={28} />
            </div>
            <span className="text-sm">Напишите первое сообщение</span>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {group.date}
                </span>
              </div>
              {group.messages.map((msg, i) => {
                const isOwn = msg.sender_id === currentUser.id;
                const senderName = msg.sender?.display_name || 'Неизвестно';
                const prevMsg = group.messages[i - 1];
                const showSender = !isOwn && chat.type === 'group' && (!prevMsg || prevMsg.sender_id !== msg.sender_id);

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 animate-message-in`}
                  >
                    {!isOwn && (
                      <div className="mr-2 mt-auto mb-1">
                        {showSender || !prevMsg || prevMsg.sender_id !== msg.sender_id ? (
                          <Avatar name={senderName} size="sm" />
                        ) : (
                          <div style={{ width: 32 }} />
                        )}
                      </div>
                    )}
                    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showSender && (
                        <span className="text-xs text-primary font-medium mb-1 px-1">{senderName}</span>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-card border border-border text-foreground rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className={`text-xs text-muted-foreground mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.created_at)}
                        {isOwn && (
                          <Icon name={msg.is_read ? 'CheckCheck' : 'Check'} size={12} className={`inline ml-1 ${msg.is_read ? 'text-primary' : ''}`} />
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="px-4 py-3 border-t border-border bg-card flex items-end gap-2">
        <button
          type="button"
          className="w-9 h-9 rounded-xl bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
        >
          <Icon name="Paperclip" size={18} />
        </button>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение..."
          rows={1}
          className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none max-h-32"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
        >
          {sending
            ? <Icon name="Loader2" size={16} className="animate-spin" />
            : <Icon name="Send" size={16} />}
        </button>
      </form>
    </div>
  );
}