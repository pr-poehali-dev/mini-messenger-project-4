import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function SettingsPanel({ user, onLogout }: Props) {
  const sections = [
    {
      title: 'Уведомления',
      items: [
        { icon: 'Bell', label: 'Push-уведомления', desc: 'Сообщения и события', toggle: true, value: true },
        { icon: 'VolumeX', label: 'Звук', desc: 'Звук новых сообщений', toggle: true, value: true },
      ]
    },
    {
      title: 'Приватность',
      items: [
        { icon: 'Eye', label: 'Статус онлайн', desc: 'Показывать другим пользователям', toggle: true, value: true },
        { icon: 'Check', label: 'Прочитанные', desc: 'Отображать галочки прочитанного', toggle: true, value: true },
      ]
    },
    {
      title: 'Аккаунт',
      items: [
        { icon: 'LogOut', label: 'Выйти', desc: `@${user.username}`, toggle: false, danger: true },
      ]
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-lg font-semibold text-foreground">Настройки</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: `hsl(${user.username.charCodeAt(0) * 17 % 360}, 60%, 50%)` }}
          >
            {user.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{user.display_name}</div>
            <div className="text-xs text-muted-foreground font-mono">@{user.username}</div>
          </div>
          <div className="ml-auto">
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        </div>

        {sections.map(section => (
          <div key={section.title}>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 px-1">
              {section.title}
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {section.items.map((item, i) => (
                <div key={item.label}>
                  {i > 0 && <div className="mx-4 h-px bg-border" />}
                  <button
                    onClick={item.danger ? onLogout : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all ${
                      item.danger ? 'hover:bg-destructive/10' : 'hover:bg-secondary cursor-default'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      item.danger ? 'bg-destructive/10' : 'bg-muted'
                    }`}>
                      <Icon
                        name={item.icon}
                        size={16}
                        className={item.danger ? 'text-destructive' : 'text-muted-foreground'}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`text-sm font-medium ${item.danger ? 'text-destructive' : 'text-foreground'}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                    {item.toggle && (
                      <div className={`w-10 h-5.5 rounded-full relative transition-all ${item.value ? 'bg-primary' : 'bg-muted'}`}
                        style={{ height: 22, width: 40 }}>
                        <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all`}
                          style={{
                            width: 18, height: 18,
                            left: item.value ? 20 : 2,
                          }} />
                      </div>
                    )}
                    {!item.toggle && !item.danger && (
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="text-center py-4">
          <div className="text-xs text-muted-foreground">Vibe Messenger v1.0</div>
          <div className="text-xs text-muted-foreground/50 mt-0.5">Минималистичное общение</div>
        </div>
      </div>
    </div>
  );
}
