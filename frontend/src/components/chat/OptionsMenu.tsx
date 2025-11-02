import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import styles from '../../styles/components/OptionsMenu.module.scss';

interface OptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement>;
}

export const OptionsMenu = ({ isOpen, onClose }: OptionsMenuProps) => {
  const { logout } = useAuthStore();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  if (!isOpen) return null;

  if (showSettings) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
          <div className={styles.menuHeader}>
            <button 
              className={styles.backBtn}
              onClick={() => setShowSettings(false)}
              title="Volver"
            >
              ←
            </button>
            <h3>Configuración</h3>
            <button 
              className={styles.closeBtn}
              onClick={onClose}
              title="Cerrar"
            >
              ✕
            </button>
          </div>
          <div className={styles.menuContent}>
            <div className={styles.settingItem}>
              <label htmlFor="theme">Tema</label>
              <select id="theme" disabled className={styles.select}>
                <option>Claro</option>
                <option>Oscuro</option>
              </select>
            </div>
            <div className={styles.settingItem}>
              <label htmlFor="notifications">Notificaciones</label>
              <input 
                id="notifications"
                type="checkbox" 
                defaultChecked 
                className={styles.checkbox}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
        <button className={styles.menuItem} onClick={handleSettings}>
          ⚙️ Configuración
        </button>
        <button className={styles.menuItem} onClick={handleLogout}>
          🚪 Cerrar sesión
        </button>
        <button className={styles.menuItem} onClick={onClose}>
          ℹ️ Acerca de
        </button>
      </div>
    </div>
  );
};
