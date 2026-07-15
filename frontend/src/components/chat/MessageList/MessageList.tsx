import { useEffect, useRef } from 'react';
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
    return <div className={styles.messageList} />;
  }

  return (
    <div className={styles.messageList}>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} currentUser={user} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
