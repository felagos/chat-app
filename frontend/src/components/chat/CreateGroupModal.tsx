import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import styles from '../../styles/components/CreateGroupModal.module.scss';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal = ({ isOpen, onClose }: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { createGroup } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!groupName.trim()) {
      setError('El nombre del grupo es requerido');
      return;
    }

    if (!participants.trim()) {
      setError('Debes añadir al menos un participante');
      return;
    }

    try {
      setIsLoading(true);
      const participantList = participants
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      if (participantList.length === 0) {
        setError('Debes añadir al menos un participante válido');
        return;
      }

      await createGroup(groupName, participantList);
      setGroupName('');
      setParticipants('');
      onClose();
    } catch (err) {
      setError('Error al crear el grupo. Intenta de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Nueva Comunidad</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="groupName">Nombre del Grupo</label>
            <input
              id="groupName"
              type="text"
              placeholder="Ej: Mis Amigos"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="participants">
              Participantes (separados por comas)
            </label>
            <textarea
              id="participants"
              placeholder="usuario1, usuario2, usuario3"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className={styles.textarea}
              rows={4}
              disabled={isLoading}
            />
            <small>Ingresa los nombres de usuario separados por comas</small>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.createBtn}
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
