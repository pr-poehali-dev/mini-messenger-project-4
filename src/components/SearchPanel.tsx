import { useState } from 'react';
import { User } from '@/types';
import { Avatar } from './Sidebar';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

interface Props {
  token: string;
  onStartChat: (userId: number) => void;
}

export default function SearchPanel({ token, onStartChat }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const data = await api.users.search(token, query);
    setResults(data.users || []);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-lg font-semibold text-foreground mb-3">Поиск</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Имя или @username"
            className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-1.5"
          >
            {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Search" size={14} />}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : searched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
            <Icon name="SearchX" size={28} />
            <span className="text-sm">Пользователи не найдены</span>
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
            <Icon name="Search" size={32} className="opacity-40" />
            <span className="text-sm">Введите имя для поиска</span>
          </div>
        ) : (
          results.map(user => (
            <div key={user.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-all mb-1">
              <div className="relative">
                <Avatar name={user.display_name} />
                {user.is_online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{user.display_name}</div>
                <div className="text-xs text-muted-foreground font-mono">@{user.username}</div>
                {user.bio && <div className="text-xs text-muted-foreground mt-0.5 truncate">{user.bio}</div>}
              </div>
              <button
                onClick={() => onStartChat(user.id)}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-medium transition-all"
              >
                Написать
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}