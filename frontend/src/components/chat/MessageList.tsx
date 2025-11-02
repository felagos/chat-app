import styles from '../../styles/components/MessageList.module.scss';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { MessageItem } from './MessageItem';

export const MessageList = () => {
  const { messages } = useChat();
  const user = useAuthStore((state) => state.user);

  return (
    <div className={styles.messageList}>
      {messages.length === 0 ? (
        <div className={styles.empty}>
          <p>Aún no hay mensajes</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            currentUser={user}
          />
        ))
      )}
    </div>
  );
};
