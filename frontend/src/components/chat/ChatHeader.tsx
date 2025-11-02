import { useMemo } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import styles from '../../styles/components/ChatHeader.module.scss';

export const ChatHeader = () => {
  const { activeConversationId, conversations } = useChatStore();
  const { user } = useAuthStore();

  const conversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const otherUser = useMemo(
    () =>
      conversation?.participants.find((p) => p.id !== user?.id) ||
      conversation?.participants[0],
    [conversation?.participants, user?.id]
  );

  if (!activeConversationId || !conversation) return null;

  return (
    <header className={styles.chatHeader}>
      <div className={styles.info}>
        <div className={styles.avatar}>
          {conversation.avatar ? (
            <img src={conversation.avatar} alt="Avatar" />
          ) : (
            <div className={styles.placeholder}>
              {otherUser?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className={styles.details}>
          <h3 className={styles.name}>
            {conversation.name || otherUser?.username || 'Usuario'}
          </h3>
          <p className={styles.status}>En línea</p>
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.iconBtn} title="Llamada">
          ☎️
        </button>
        <button className={styles.iconBtn} title="Videollamada">
          📹
        </button>
        <button className={styles.iconBtn} title="Más opciones">
          ⋮
        </button>
      </div>
    </header>
  );
};
