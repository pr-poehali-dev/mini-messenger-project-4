import { useState } from 'react';
import { User } from '@/types';

import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

interface Props {
  user: User;
  token: string;
  onUpdate: (user: User) => void;
}

export default function ProfilePanel({ user, token, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.display_name);
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data = await api.users.updateProfile(token, { display_name: displayName, bio });
    if (data.user) {
      onUpdate(data.user);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Профиль</h2>
        <button
          onClick={() => setEditing(!editing)}
          className="w-8 h-8 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all"
        >
          <Icon name={editing ? 'X' : 'Pencil'} size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-4 py-6 gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden">
              <Avatar name={user.display_name} size="md" />
            </div>
            <div
              style={{ width: 80, height: 80 }}
              className="rounded-2xl overflow-hidden"
            />
          </div>
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
            style={{
              background: `hsl(${user.username.charCodeAt(0) * 17 % 360}, 60%, 50%)`
            }}
          >
            {user.display_name.charAt(0).toUpperCase()}
          </div>

          {saved && (
            <div className="flex items-center gap-2 text-green-500 text-sm animate-fade-in">
              <Icon name="CheckCircle2" size={14} />
              Сохранено
            </div>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="px-4 space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Имя</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">О себе</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Расскажите о себе..."
                rows={3}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : 'Сохранить'}
            </button>
          </form>
        ) : (
          <div className="px-4 space-y-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Имя</div>
              <div className="text-sm text-foreground font-medium">{user.display_name}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Логин</div>
              <div className="text-sm text-foreground font-mono">@{user.username}</div>
            </div>
            {user.bio && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">О себе</div>
                <div className="text-sm text-foreground">{user.bio}</div>
              </div>
            )}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">В Vibe с</div>
              <div className="text-sm text-foreground">
                {new Date(user.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}