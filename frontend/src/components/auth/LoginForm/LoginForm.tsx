import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AuthCard } from '../AuthCard';
import styles from './LoginForm.module.scss';

export const LoginForm = () => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (!email.trim() || !password || isLoading) return;
    login(email.trim(), password);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <AuthCard subtitle="Iniciá sesión para ver tus mensajes">
      <div className={styles.fields}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Usuario"
          disabled={isLoading}
          className={styles.input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Contraseña"
          disabled={isLoading}
          className={styles.input}
        />
      </div>

      {error && (
        <div className={styles.error}>
          {error instanceof Error ? error.message : 'Usuario o contraseña incorrectos'}
        </div>
      )}

      <button onClick={handleSubmit} disabled={isLoading} className={styles.submit}>
        {isLoading ? 'Ingresando…' : 'Ingresar'}
      </button>

      <div className={styles.hint}>
        ¿No tenés cuenta? <Link to="/auth/register">Registrate</Link>
      </div>
    </AuthCard>
  );
};
