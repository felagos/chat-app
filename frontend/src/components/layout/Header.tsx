import { useAuthStore } from '../../store/authStore';
import styles from '../../styles/components/Header.module.scss';

export const Header = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>Chat App</h1>

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
