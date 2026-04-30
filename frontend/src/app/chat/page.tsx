import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Spin, Empty } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
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

const { Content } = Layout;

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
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className={styles.chatPage}>
      <Header />
      <Content className={styles.container}>
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
              <Empty
                image={<MessageOutlined className={styles.emptyIcon} />}
                description={
                  <span>
                    <strong>Selecciona una conversación</strong>
                    <br />
                    Elige un chat de la lista para empezar a conversar
                  </span>
                }
              />
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
}

