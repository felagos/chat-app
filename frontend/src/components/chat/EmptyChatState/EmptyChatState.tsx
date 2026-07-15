import styles from './EmptyChatState.module.scss';

export const EmptyChatState = () => (
  <div className={styles.emptyState}>
    <div className={styles.icon}>💬</div>
    <div className={styles.text}>Elegí un contacto para empezar a chatear</div>
  </div>
);
