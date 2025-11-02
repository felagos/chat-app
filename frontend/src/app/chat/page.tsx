import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useLoadConversations } from '../../hooks/useLoadConversations';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { Header } from '../../components/layout/Header';
import { ChatList } from '../../components/chat/ChatList';
import { MessageList } from '../../components/chat/MessageList';
import { MessageInput } from '../../components/chat/MessageInput';
import styles from '../../styles/pages/ChatPage.module.scss';

export default function ChatPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { activeConversationId } = useChatStore();

  useSocket();
  useLoadConversations();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <div>Cargando...</div>;
  }

  return (
    <div className={styles.chatPage}>
      <Header />
      <div className={styles.container}>
        <ChatList />
        <div className={styles.chatArea}>
          {activeConversationId ? (
            <>
              <MessageList />
              <MessageInput />
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>Selecciona una conversación para comenzar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
