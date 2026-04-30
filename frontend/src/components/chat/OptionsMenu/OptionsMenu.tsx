import { Drawer, List, Switch, Typography, Divider, Button } from 'antd';
import { SettingOutlined, LogoutOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../../store/authStore';
import styles from './OptionsMenu.module.scss';

const { Text } = Typography;

export interface OptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OptionsMenu = ({ isOpen, onClose }: OptionsMenuProps) => {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Drawer
      title={
        <span>
          <SettingOutlined /> Configuración
        </span>
      }
      placement="right"
      open={isOpen}
      onClose={onClose}
      width={300}
    >
      <div className={styles.section}>
        <Text strong className={styles.sectionTitle}>
          Preferencias
        </Text>
        <List bordered={false} className={styles.list}>
          <List.Item actions={[<Switch disabled key="theme-switch" />]}>
            <List.Item.Meta
              title="Tema oscuro"
              description={<Text type="secondary">Próximamente</Text>}
            />
          </List.Item>
          <List.Item actions={[<Switch key="notifications-switch" defaultChecked />]}>
            <List.Item.Meta
              title="Notificaciones"
              description={<Text type="secondary">Recibir alertas</Text>}
            />
          </List.Item>
        </List>
      </div>

      <Divider />

      <div className={styles.actions}>
        <Button
          icon={<InfoCircleOutlined />}
          block
          className={styles.actionBtn}
          onClick={onClose}
        >
          Acerca de
        </Button>
        <Button
          icon={<LogoutOutlined />}
          block
          danger
          onClick={handleLogout}
          className={styles.logoutBtn}
        >
          Cerrar sesión
        </Button>
      </div>
    </Drawer>
  );
};
