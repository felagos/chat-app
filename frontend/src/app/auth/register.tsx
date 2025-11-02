import styles from '../../styles/pages/AuthPage.module.scss';
import { RegisterForm } from '../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className={styles.authPage}>
      <div className={styles.container}>
        <div className={styles.branding}>
          <h1>Chat App</h1>
          <p>Únete a nuestra comunidad</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
