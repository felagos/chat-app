import { Typography } from 'antd';
import clsx from 'clsx';
import { formatTime } from '../../../lib/utils';
import type { Message, User } from '../../../types';
import styles from './MessageItem.module.scss';

const { Text } = Typography;

export interface MessageItemProps {
  message: Message;
  currentUser: User | null;
}

export const MessageItem = ({ message, currentUser }: MessageItemProps) => {
  const isOwn = message.senderId === currentUser?.id;

  return (
    <div className={clsx(styles.wrapper, isOwn ? styles.own : styles.other)}>
      <div className={clsx(styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble)}>
        <Text className={styles.text}>{message.content}</Text>
        <Text type="secondary" className={styles.time}>
          {formatTime(message.timestamp)}
        </Text>
      </div>
    </div>
  );
};
