import Icon from '@/components/ui/icon';
import { ActiveSection, User } from '@/types';

interface Props {
  active: ActiveSection;
  onNavigate: (s: ActiveSection) => void;
  user: User;
}

const NAV = [
  { id: 'chats', icon: 'MessageSquare', label: 'Чаты' },
  { id: 'groups', icon: 'Users', label: 'Группы' },
  { id: 'contacts', icon: 'Contact', label: 'Контакты' },
  { id: 'search', icon: 'Search', label: 'Поиск' },
] as const;

const BOTTOM_NAV = [
  { id: 'profile', icon: 'User', label: 'Профиль' },
  { id: 'settings', icon: 'Settings', label: 'Настройки' },
] as const;

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
  const color = colors[name.charCodeAt(0) % colors.length];
  const dim = size === 'sm' ? 32 : 36;
  return (
    <div
      style={{ width: dim, height: dim, backgroundColor: color, minWidth: dim }}
      className="rounded-full flex items-center justify-center text-white font-semibold"
    >
      <span style={{ fontSize: size === 'sm' ? 13 : 14 }}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

export { Avatar };

export default function Sidebar({ active, onNavigate, user }: Props) {
  return (
    <aside className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-1 shrink-0">
      <div className="mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Icon name="Zap" size={18} className="text-white" />
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              active === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Icon name={item.icon} size={20} />
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {BOTTOM_NAV.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              active === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Icon name={item.icon} size={20} />
          </button>
        ))}
        <div className="mt-2">
          <Avatar name={user.display_name} />
        </div>
      </div>
    </aside>
  );
}
