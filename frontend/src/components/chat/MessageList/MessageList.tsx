import { useEffect, useRef } from 'react';
import { Spin, Empty } from 'antd';
import { useChat } from '../../../hooks/useChat';
import { useAuthStore } from '../../../store/authStore';
import { MessageItem } from '../MessageItem';
import styles from './MessageList.module.scss';

export const MessageList = () => {
  const { messages, isLoading } = useChat();
  const user = useAuthStore((state) => state.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.messageList}>
      {messages.length === 0 ? (
        <Empty
          description="Aún no hay mensajes"
          className={styles.empty}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        messages.map((message) => (
          <MessageItem key={message.id} message={message} currentUser={user} />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};
