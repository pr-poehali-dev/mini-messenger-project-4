import { useState, useEffect } from 'react';
import { User } from '@/types';
import { Avatar } from './Sidebar';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

interface Props {
  token: string;
  onStartChat: (userId: number) => void;
}

export default function ContactsPanel({ token, onStartChat }: Props) {
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUsername, setAddUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchContacts(); }, []);

  async function fetchContacts() {
    const data = await api.contacts.list(token);
    setContacts(data.contacts || []);
    setLoading(false);
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (!addUsername.trim()) return;
    setAdding(true);
    setAddError('');
    setAddSuccess('');
    const data = await api.contacts.add(token, addUsername.trim());
    if (data.contact) {
      setAddSuccess(`${data.contact?.display_name || addUsername} добавлен`);
      setAddUsername('');
      setShowAdd(false);
      fetchContacts();
    } else {
      setAddError(data.error || 'Пользователь не найден');
    }
    setAdding(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Контакты</h2>
        <button
          onClick={() => { setShowAdd(!showAdd); setAddError(''); setAddSuccess(''); }}
          className="w-8 h-8 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all"
        >
          <Icon name="UserPlus" size={16} />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addContact} className="mx-4 mb-3 animate-fade-in">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={addUsername}
              onChange={e => setAddUsername(e.target.value)}
              placeholder="username"
              className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono"
            />
            <button
              type="submit"
              disabled={adding}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
            >
              {adding ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Добавить'}
            </button>
          </div>
          {addError && <p className="text-xs text-destructive">{addError}</p>}
          {addSuccess && <p className="text-xs text-green-500">{addSuccess}</p>}
        </form>
      )}

      <div className="flex-1 overflow-y-auto px-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
            <Icon name="Users" size={28} />
            <span className="text-sm">Нет контактов</span>
          </div>
        ) : (
          contacts.map(contact => (
            <div key={contact.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary transition-all mb-1">
              <div className="relative">
                <Avatar name={contact.display_name} />
                {contact.is_online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{contact.display_name}</div>
                <div className="text-xs text-muted-foreground font-mono">@{contact.username}</div>
              </div>
              <button
                onClick={() => onStartChat(contact.id)}
                className="w-8 h-8 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all"
                title="Написать"
              >
                <Icon name="MessageSquare" size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}