import styles from '../../styles/components/MessageList.module.scss';
import { formatTime } from '../../lib/utils';
import type { Message, User } from '../../types';

interface MessageItemProps {
  message: Message;
  currentUser: User | null;
}

export const MessageItem = ({ message, currentUser }: MessageItemProps) => {
  const isOwn = message.senderId === currentUser?.id;

  return (
    <div
      className={`${styles.message} ${isOwn ? styles.own : styles.other}`}
    >
      <div className={styles.content}>
        <p className={styles.text}>{message.content}</p>
        <span className={styles.time}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};
