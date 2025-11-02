import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import styles from '../../styles/components/Header.module.scss';

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreateConversation();
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>Chat App</h1>

        <div className={styles.searchSection}>
          {showUserSearch && (
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className={styles.searchInput}
                autoFocus
              />
              <button
                className={styles.searchBtn}
                onClick={handleCreateConversation}
              >
                Enviar
              </button>
            </div>
          )}
          <button
            className={styles.newChatBtn}
            onClick={() => setShowUserSearch(!showUserSearch)}
          >
            {showUserSearch ? 'Cancelar' : '+ Nuevo chat'}
          </button>
        </div>

        <div className={styles.userSection}>
          <span className={styles.username}>
            {user?.username}
          </span>
          <button
            className={styles.logoutBtn}
            onClick={() => logout()}
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
};
