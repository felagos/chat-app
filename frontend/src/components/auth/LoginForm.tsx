import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../styles/components/LoginForm.module.scss';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Iniciar Sesión</h2>

      {error && <div className={styles.error}>{String(error)}</div>}

      <div className={styles.group}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className={styles.group}>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={styles.submitBtn}
      >
        {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
      </button>

      <p className={styles.link}>
        ¿No tienes cuenta?{' '}
        <a href="/auth/register">Regístrate aquí</a>
      </p>
    </form>
  );
};
