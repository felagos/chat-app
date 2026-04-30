import { useMemo } from 'react';
import { Avatar, Typography, Button, Space, Tooltip } from 'antd';
import { PhoneOutlined, VideoCameraOutlined, MoreOutlined } from '@ant-design/icons';
import { useChatStore } from '../../../store/chatStore';
import { useAuthStore } from '../../../store/authStore';
import styles from './ChatHeader.module.scss';

const { Text } = Typography;

export const ChatHeader = () => {
  const { activeConversationId, conversations } = useChatStore();
  const { user } = useAuthStore();

  const conversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const otherUser = useMemo(
    () =>
      conversation?.participants.find((p) => p.id !== user?.id) ??
      conversation?.participants[0],
    [conversation?.participants, user?.id]
  );

  if (!activeConversationId || !conversation) return null;

  const name = conversation.name ?? otherUser?.username ?? 'Usuario';
  const initial = name[0]?.toUpperCase() ?? '?';

  return (
    <header className={styles.chatHeader}>
      <div className={styles.info}>
        {conversation.avatar ? (
          <Avatar src={conversation.avatar} size={40} />
        ) : (
          <Avatar size={40} className={styles.avatar}>
            {initial}
          </Avatar>
        )}
        <div className={styles.details}>
          <Text strong className={styles.name}>
            {name}
          </Text>
          <Text type="secondary" className={styles.status}>
            En línea
          </Text>
        </div>
      </div>

      <Space className={styles.actions}>
        <Tooltip title="Llamada">
          <Button
            shape="circle"
            icon={<PhoneOutlined />}
            className={styles.iconBtn}
          />
        </Tooltip>
        <Tooltip title="Videollamada">
          <Button
            shape="circle"
            icon={<VideoCameraOutlined />}
            className={styles.iconBtn}
          />
        </Tooltip>
        <Tooltip title="Más opciones">
          <Button
            shape="circle"
            icon={<MoreOutlined />}
            className={styles.iconBtn}
          />
        </Tooltip>
      </Space>
    </header>
  );
};
