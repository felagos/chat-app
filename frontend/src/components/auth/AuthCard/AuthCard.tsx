import type { ReactNode } from 'react';
import { useUIStore } from '../../../store/uiStore';
import styles from './AuthCard.module.scss';

export interface AuthCardProps {
  subtitle: string;
  children: ReactNode;
}

export const AuthCard = ({ subtitle, children }: AuthCardProps) => {
  const { theme, toggleTheme } = useUIStore();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <button
          onClick={toggleTheme}
          title="Cambiar modo"
          className={styles.themeToggle}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <div className={styles.logo}>💬</div>
        <div className={styles.title}>Charla</div>
        <div className={styles.subtitle}>{subtitle}</div>

        {children}
      </div>
    </div>
  );
};
