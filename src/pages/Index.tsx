import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import AuthScreen from '@/components/AuthScreen';
import Sidebar from '@/components/Sidebar';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import ContactsPanel from '@/components/ContactsPanel';
import SearchPanel from '@/components/SearchPanel';
import ProfilePanel from '@/components/ProfilePanel';
import SettingsPanel from '@/components/SettingsPanel';
import Icon from '@/components/ui/icon';
import { ActiveSection, Chat } from '@/types';

export default function Index() {
  const { user, loading, token, login, register, logout, setUser } = useAuth();
  const [activeSection, setActiveSection] = useState<ActiveSection>('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  async function handleStartChat(userId: number) {
    if (!token) return;
    const data = await api.chats.createDirect(token, userId);
    if (data.chat) {
      setSelectedChat(data.chat);
      setActiveSection('chats');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <Icon name="Zap" size={24} className="text-white" />
          </div>
          <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return <AuthScreen onLogin={login} onRegister={register} />;
  }

  const showChatWindow = selectedChat && (activeSection === 'chats' || activeSection === 'groups');

  return (
    <div className="h-screen bg-background flex overflow-hidden animate-fade-in">
      <Sidebar active={activeSection} onNavigate={(s) => { setActiveSection(s); }} user={user} />

      <div className="w-72 shrink-0 border-r border-border bg-card flex flex-col">
        {activeSection === 'chats' && (
          <ChatList
            token={token}
            currentUser={user}
            selectedChatId={selectedChat?.id ?? null}
            onSelectChat={setSelectedChat}
            title="Чаты"
            filterType="direct"
          />
        )}
        {activeSection === 'groups' && (
          <ChatList
            token={token}
            currentUser={user}
            selectedChatId={selectedChat?.id ?? null}
            onSelectChat={setSelectedChat}
            title="Группы"
            filterType="group"
          />
        )}
        {activeSection === 'contacts' && (
          <ContactsPanel token={token} onStartChat={handleStartChat} />
        )}
        {activeSection === 'search' && (
          <SearchPanel token={token} onStartChat={handleStartChat} />
        )}
        {activeSection === 'profile' && (
          <ProfilePanel user={user} token={token} onUpdate={setUser} />
        )}
        {activeSection === 'settings' && (
          <SettingsPanel user={user} onLogout={logout} />
        )}
      </div>

      <div className="flex-1 flex flex-col bg-background">
        {showChatWindow ? (
          <ChatWindow chat={selectedChat} token={token} currentUser={user} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="w-20 h-20 rounded-3xl bg-card border border-border flex items-center justify-center">
              <Icon name="MessageSquare" size={36} className="text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <div className="font-medium text-foreground">Выберите чат</div>
              <div className="text-sm mt-1 text-muted-foreground">или найдите пользователя для начала диалога</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}