import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AuthCard } from '../AuthCard';
import styles from './RegisterForm.module.scss';

export const RegisterForm = () => {
  const { register, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    if (isLoading) return;
    if (!username.trim() || !email.trim() || !password) {
      setFormError('Completá todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }
    setFormError('');
    register(username.trim(), email.trim(), password);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const displayedError =
    formError || (error instanceof Error ? error.message : error ? 'No se pudo crear la cuenta' : '');

  return (
    <AuthCard subtitle="Creá tu cuenta para empezar a chatear">
      <div className={styles.fields}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Usuario"
          disabled={isLoading}
          className={styles.input}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Correo electrónico"
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
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Confirmar contraseña"
          disabled={isLoading}
          className={styles.input}
        />
      </div>

      {displayedError && <div className={styles.error}>{displayedError}</div>}

      <button onClick={handleSubmit} disabled={isLoading} className={styles.submit}>
        {isLoading ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <div className={styles.hint}>
        ¿Ya tenés cuenta? <Link to="/auth/login">Iniciá sesión</Link>
      </div>
    </AuthCard>
  );
};
