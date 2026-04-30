import { useState } from 'react';
import { Layout, Button, Input, Space, Avatar, Typography, Tooltip } from 'antd';
import {
  PlusOutlined,
  CloseOutlined,
  CheckOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import clsx from 'clsx';
import { useAuthStore } from '../../../store/authStore';
import { useChatStore } from '../../../store/chatStore';
import styles from './Header.module.scss';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export const Header = () => {
  const { user, logout } = useAuthStore();
  const { createConversation } = useChatStore();
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');

  const handleCreateConversation = () => {
    if (searchUsername.trim()) {
      createConversation(searchUsername);
      setSearchUsername('');
      setShowUserSearch(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreateConversation();
    if (e.key === 'Escape') setShowUserSearch(false);
  };

  return (
    <AntHeader className={styles.header}>
      <Text strong className={styles.title}>
        Chat App
      </Text>

      <div className={styles.searchSection}>
        {showUserSearch && (
          <Space.Compact className={styles.searchBox}>
            <Input
              placeholder="Buscar usuario..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <Tooltip title="Confirmar">
              <Button
                icon={<CheckOutlined />}
                onClick={handleCreateConversation}
                disabled={!searchUsername.trim()}
                type="primary"
              />
            </Tooltip>
          </Space.Compact>
        )}
        <Tooltip title={showUserSearch ? 'Cancelar' : 'Nuevo chat'}>
          <Button
            shape="circle"
            icon={showUserSearch ? <CloseOutlined /> : <PlusOutlined />}
            onClick={() => setShowUserSearch((v) => !v)}
            className={clsx(styles.iconBtn, showUserSearch && styles.cancelBtn)}
          />
        </Tooltip>
      </div>

      <div className={styles.userSection}>
        <Avatar icon={<UserOutlined />} size="small" className={styles.avatar} />
        <Text className={styles.username}>{user?.username}</Text>
        <Tooltip title="Cerrar sesión">
          <Button
            shape="circle"
            icon={<LogoutOutlined />}
            onClick={() => logout()}
            className={styles.logoutBtn}
          />
        </Tooltip>
      </div>
    </AntHeader>
  );
};
