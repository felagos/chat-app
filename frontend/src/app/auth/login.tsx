import styles from '../../styles/pages/AuthPage.module.scss';
import { LoginForm } from '../../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className={styles.authPage}>
      <div className={styles.container}>
        <div className={styles.branding}>
          <h1>Chat App</h1>
          <p>Conecta con tus amigos en tiempo real</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
