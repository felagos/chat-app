import clsx from 'clsx';
import { formatTime } from '../../../lib/utils';
import type { Message, User } from '../../../types';
import styles from './MessageItem.module.scss';

export interface MessageItemProps {
  message: Message;
  currentUser: User | null;
}

export const MessageItem = ({ message, currentUser }: MessageItemProps) => {
  const isOwn = message.userId === currentUser?.id;

  return (
    <div className={clsx(styles.wrapper, isOwn && styles.own)}>
      <div className={clsx(styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble)}>
        <div className={styles.text}>{message.content}</div>
        <div className={styles.time}>{formatTime(message.createdAt)}</div>
      </div>
    </div>
  );
};
