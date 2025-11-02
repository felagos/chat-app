import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../styles/components/RegisterForm.module.scss';

export const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    register(username, email, password);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Crear Cuenta</h2>

      {error && <div className={styles.error}>{String(error)}</div>}

      <div className={styles.group}>
        <label htmlFor="username">Nombre de usuario</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

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

      <div className={styles.group}>
        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={styles.submitBtn}
      >
        {isLoading ? 'Cargando...' : 'Registrarse'}
      </button>

      <p className={styles.link}>
        ¿Ya tienes cuenta?{' '}
        <a href="/auth/login">Inicia sesión aquí</a>
      </p>
    </form>
  );
};
