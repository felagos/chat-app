import { useState, useMemo } from 'react';
import { List, Avatar, Badge, Input, Typography, Button, Empty, Tooltip, Modal } from 'antd';
import { TeamOutlined, DeleteOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import { useChatStore } from '../../../store/chatStore';
import { formatDate, truncateText } from '../../../lib/utils';
import { CreateGroupModal } from '../CreateGroupModal';
import { OptionsMenu } from '../OptionsMenu';
import styles from './ChatList.module.scss';

const { Text } = Typography;
const { Search } = Input;

export const ChatList = () => {
  const { conversations, activeConversationId, setActiveConversation, deleteConversation } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleDeleteConversation = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: '¿Eliminar chat?',
      content: `Se eliminará "${name}" y todos sus mensajes permanentemente.`,
      okText: 'Eliminar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => deleteConversation(id),
    });
  };

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        const name = conversation.name || conversation.participants[0]?.username || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      }),
    [conversations, searchTerm]
  );

  return (
    <div className={styles.chatList}>
      <div className={styles.header}>
        <Text strong className={styles.title}>
          Chats
        </Text>
        <div className={styles.icons}>
          <Tooltip title="Nuevo grupo">
            <Button
              shape="circle"
              icon={<TeamOutlined />}
              onClick={() => setShowCreateGroup(true)}
              className={styles.iconBtn}
            />
          </Tooltip>
        </div>
      </div>

      <div className={styles.searchBox}>
        <Search
          placeholder="Buscar chat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>

      <div className={styles.conversationList}>
        {filteredConversations.length === 0 ? (
          <Empty
            description={searchTerm ? 'No se encontraron chats' : 'No hay conversaciones'}
            className={styles.empty}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={filteredConversations}
            renderItem={(conversation) => {
              const name =
                conversation.name || conversation.participants[0]?.username || 'Usuario';
              const initial = name[0]?.toUpperCase() ?? '?';
              const isActive = activeConversationId === conversation.id;

              return (
                <List.Item
                  key={conversation.id}
                  className={clsx(styles.conversationItem, isActive && styles.active)}
                  onClick={() => setActiveConversation(conversation.id)}
                  actions={[
                    <Tooltip title="Eliminar chat" key="delete">
                      <Button
                        shape="circle"
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        className={styles.deleteBtn}
                        onClick={(e) => handleDeleteConversation(conversation.id, name, e)}
                      />
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={conversation.unreadCount} size="small">
                        {conversation.avatar ? (
                          <Avatar src={conversation.avatar} size={46} />
                        ) : (
                          <Avatar size={46} className={styles.avatarPlaceholder}>
                            {initial}
                          </Avatar>
                        )}
                      </Badge>
                    }
                    title={
                      <div className={styles.itemHeader}>
                        <Text ellipsis className={styles.itemName}>
                          {name}
                        </Text>
                        {conversation.lastMessageAt && (
                          <Text type="secondary" className={styles.itemTime}>
                            {formatDate(conversation.lastMessageAt)}
                          </Text>
                        )}
                      </div>
                    }
                    description={
                      <Text type="secondary" ellipsis className={styles.preview}>
                        {conversation.lastMessage
                          ? truncateText(conversation.lastMessage.content, 50)
                          : 'Sin mensajes'}
                      </Text>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </div>

      <CreateGroupModal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
      <OptionsMenu isOpen={showOptions} onClose={() => setShowOptions(false)} />
    </div>
  );
};
