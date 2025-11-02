import { useState, useMemo } from 'react';
import styles from '../../styles/components/ChatList.module.scss';
import { useChatStore } from '../../store/chatStore';
import { formatDate, truncateText } from '../../lib/utils';

export const ChatList = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
  } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        const name =
          conversation.name || conversation.participants[0]?.username || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      }),
    [conversations, searchTerm]
  );

  return (
    <div className={styles.chatList}>
      <div className={styles.header}>
        <h2>Chats</h2>
        <div className={styles.icons}>
          <button title="Nueva comunidad">👥</button>
          <button title="Más opciones">⋮</button>
        </div>
      </div>

      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Buscar chat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.conversationList}>
        {filteredConversations.length === 0 ? (
          <div className={styles.empty}>
            <p>
              {searchTerm ? 'No se encontraron chats' : 'No hay conversaciones'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`${styles.conversationItem} ${
                activeConversationId === conversation.id ? styles.active : ''
              }`}
              onClick={() => setActiveConversation(conversation.id)}
            >
              <div className={styles.avatar}>
                {conversation.avatar ? (
                  <img
                    src={conversation.avatar}
                    alt="Avatar"
                  />
                ) : (
                  <div className={styles.placeholder}>
                    {conversation.name?.[0] || conversation.participants[0]?.username?.[0] || '?'}
                  </div>
                )}
              </div>

              <div className={styles.content}>
                <div className={styles.header}>
                  <span className={styles.name}>
                    {conversation.name ||
                      conversation.participants[0]?.username}
                  </span>
                  {conversation.lastMessageAt && (
                    <span className={styles.time}>
                      {formatDate(conversation.lastMessageAt)}
                    </span>
                  )}
                </div>

                <p className={styles.preview}>
                  {conversation.lastMessage
                    ? truncateText(conversation.lastMessage.content, 50)
                    : 'Sin mensajes'}
                </p>

                {conversation.unreadCount > 0 && (
                  <span className={styles.badge}>
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
