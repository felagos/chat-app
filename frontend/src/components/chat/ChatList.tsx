import styles from '../../styles/components/ChatList.module.scss';
import { useChatStore } from '../../store/chatStore';
import { formatDate, truncateText } from '../../lib/utils';

export const ChatList = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
  } = useChatStore();

  return (
    <div className={styles.chatList}>
      <div className={styles.header}>
        <h2>Mensajes</h2>
      </div>

      <div className={styles.conversationList}>
        {conversations.length === 0 ? (
          <div className={styles.empty}>
            <p>No hay conversaciones</p>
          </div>
        ) : (
          conversations.map((conversation) => (
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
                    {conversation.name?.[0] || '?'}
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
