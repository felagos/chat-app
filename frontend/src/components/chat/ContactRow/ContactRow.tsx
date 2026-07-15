import { useState } from 'react';
import clsx from 'clsx';
import { useChatStore } from '../../../store/chatStore';
import { useAuthStore } from '../../../store/authStore';
import { colorForName, initialsForName, truncateText } from '../../../lib/utils';
import type { Conversation } from '../../../types';
import styles from './ContactRow.module.scss';

export interface ContactRowProps {
  conversation: Conversation;
}

export const ContactRow = ({ conversation }: ContactRowProps) => {
  const currentUser = useAuthStore((state) => state.user);
  const { activeConversationId, onlineUsers, setActiveConversation, deleteConversation } =
    useChatStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const otherUser =
    conversation.participants.find((p) => p.id !== currentUser?.id) ??
    conversation.participants[0];

  const name = conversation.name || otherUser?.username || 'Usuario';
  const isOnline = !!(otherUser && onlineUsers.has(otherUser.id));
  const isActive = activeConversationId === conversation.id;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDelete(false);
    deleteConversation(conversation.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDelete(false);
  };

  return (
    <div
      onClick={() => setActiveConversation(conversation.id)}
      className={clsx(styles.row, isActive && styles.active)}
    >
      <div className={styles.avatarWrap}>
        <div className={styles.avatar} style={{ background: colorForName(name) }}>
          {initialsForName(name)}
        </div>
        <span
          className={styles.statusDot}
          style={{ background: isOnline ? 'var(--online)' : 'var(--offline)' }}
        />
      </div>

      <div className={styles.info}>
        <div className={styles.name}>{name}</div>
        <div className={styles.lastMessage}>
          {conversation.lastMessage
            ? truncateText(conversation.lastMessage.content, 40)
            : 'Sin mensajes todavía'}
        </div>
      </div>

      {confirmingDelete ? (
        <div className={styles.confirmActions}>
          <button onClick={handleConfirmDelete} title="Confirmar" className={styles.confirmBtn}>
            ✓
          </button>
          <button onClick={handleCancelDelete} title="Cancelar" className={styles.cancelBtn}>
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={handleDeleteClick}
          title="Eliminar contacto"
          className={styles.deleteBtn}
        >
          🗑
        </button>
      )}
    </div>
  );
};
