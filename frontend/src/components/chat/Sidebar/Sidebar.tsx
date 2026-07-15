import { useAuthStore } from '../../../store/authStore';
import { useChatStore } from '../../../store/chatStore';
import { useUIStore } from '../../../store/uiStore';
import { AddContactForm } from '../AddContactForm';
import { ContactRow } from '../ContactRow';
import styles from './Sidebar.module.scss';

export const Sidebar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const conversations = useChatStore((state) => state.conversations);
  const { theme, toggleTheme } = useUIStore();

  const myInitial = (user?.username || '?')[0]?.toUpperCase();

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.avatar}>{myInitial}</div>
        <div className={styles.brand}>
          <div className={styles.title}>Charla</div>
          <div className={styles.username}>{user?.username}</div>
        </div>
        <button onClick={toggleTheme} title="Cambiar modo" className={styles.iconBtn}>
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button onClick={logout} title="Cerrar sesión" className={styles.iconBtn}>
          ⏻
        </button>
      </div>

      <AddContactForm />

      <div className={styles.contactList}>
        {conversations.length === 0 ? (
          <div className={styles.empty}>
            Todavía no tenés contactos.
            <br />
            Agregá uno para empezar a chatear.
          </div>
        ) : (
          conversations.map((conversation) => (
            <ContactRow key={conversation.id} conversation={conversation} />
          ))
        )}
      </div>
    </div>
  );
};
