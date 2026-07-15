import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useChatStore } from '../../../store/chatStore';
import styles from './AddContactForm.module.scss';

export const AddContactForm = () => {
  const createConversation = useChatStore((state) => state.createConversation);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleOpen = () => {
    setOpen((prev) => !prev);
    setName('');
    setError('');
  };

  const handleSubmit = async () => {
    const username = name.trim();
    if (!username || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      await createConversation(username);
      setName('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el contacto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className={styles.container}>
      <button onClick={toggleOpen} className={styles.toggleBtn}>
        <span className={styles.plus}>+</span>
        <span>{open ? 'Cancelar' : 'Agregar contacto'}</span>
      </button>

      {open && (
        <div className={styles.addBox}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre del contacto"
            disabled={submitting}
            className={styles.input}
          />
          <button onClick={handleSubmit} disabled={submitting} className={styles.saveBtn}>
            {submitting ? 'Guardando…' : 'Guardar contacto'}
          </button>
          {error && <div className={styles.error}>{error}</div>}
        </div>
      )}
    </div>
  );
};
