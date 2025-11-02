import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useLoadConversations } from '../../hooks/useLoadConversations';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { Header } from '../../components/layout/Header';
import { ChatHeader } from '../../components/chat/ChatHeader';
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
              <ChatHeader />
              <MessageList />
              <MessageInput />
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.icon}>💬</div>
              <h2>Selecciona una conversación</h2>
              <p>Elige un chat de la lista para empezar a conversar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
