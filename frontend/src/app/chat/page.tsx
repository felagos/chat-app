import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useLoadConversations } from '../../hooks/useLoadConversations';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { Sidebar } from '../../components/chat/Sidebar';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MessageList } from '../../components/chat/MessageList';
import { MessageInput } from '../../components/chat/MessageInput';
import { EmptyChatState } from '../../components/chat/EmptyChatState';
import styles from '../../styles/pages/ChatPage.module.scss';

export default function ChatPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  useSocket();
  useLoadConversations();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className={styles.chatPage}>
      <Sidebar />
      <div className={styles.chatArea}>
        {activeConversationId ? (
          <>
            <ChatHeader />
            <MessageList />
            <MessageInput />
          </>
        ) : (
          <EmptyChatState />
        )}
      </div>
    </div>
  );
}
