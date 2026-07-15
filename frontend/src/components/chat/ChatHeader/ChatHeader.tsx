import { useMemo } from 'react';
import { useChatStore } from '../../../store/chatStore';
import { useAuthStore } from '../../../store/authStore';
import { colorForName, initialsForName } from '../../../lib/utils';
import styles from './ChatHeader.module.scss';

export const ChatHeader = () => {
  const { activeConversationId, conversations, onlineUsers, typingUsers } = useChatStore();
  const user = useAuthStore((state) => state.user);

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

  const name = conversation.name || otherUser?.username || 'Usuario';
  const isOnline = !!(otherUser && onlineUsers.has(otherUser.id));
  const isTyping = !!(otherUser && typingUsers[activeConversationId]?.includes(otherUser.id));

  const statusText = isTyping ? 'Escribiendo…' : isOnline ? 'En línea' : 'Desconectado';
  const statusColor = isTyping || isOnline ? 'var(--online-text)' : 'var(--muted)';

  return (
    <div className={styles.chatHeader}>
      <div className={styles.avatar} style={{ background: colorForName(name) }}>
        {initialsForName(name)}
      </div>
      <div>
        <div className={styles.name}>{name}</div>
        <div className={styles.status} style={{ color: statusColor }}>
          {statusText}
        </div>
      </div>
    </div>
  );
};
