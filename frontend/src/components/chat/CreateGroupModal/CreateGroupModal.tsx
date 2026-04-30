import { Form, Input, Button, Modal, App } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useChatStore } from '../../../store/chatStore';
import styles from './CreateGroupModal.module.scss';

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateGroupFormValues {
  groupName: string;
  participants: string;
}

export const CreateGroupModal = ({ isOpen, onClose }: CreateGroupModalProps) => {
  const { createGroup } = useChatStore();
  const [form] = Form.useForm<CreateGroupFormValues>();
  const { message } = App.useApp();

  const handleFinish = async (values: CreateGroupFormValues) => {
    const participantList = values.participants
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (participantList.length === 0) {
      form.setFields([
        { name: 'participants', errors: ['Ingresa al menos un participante válido'] },
      ]);
      return;
    }

    try {
      await createGroup(values.groupName, participantList);
      void message.success('Grupo creado exitosamente');
      form.resetFields();
      onClose();
    } catch {
      void message.error('Error al crear el grupo');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <span>
          <TeamOutlined /> Nueva Comunidad
        </span>
      }
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      <Form<CreateGroupFormValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className={styles.form}
        size="large"
      >
        <Form.Item
          name="groupName"
          label="Nombre del Grupo"
          rules={[{ required: true, message: 'El nombre del grupo es requerido' }]}
        >
          <Input placeholder="Ej: Mis Amigos" />
        </Form.Item>

        <Form.Item
          name="participants"
          label="Participantes (separados por comas)"
          rules={[{ required: true, message: 'Agrega al menos un participante' }]}
          extra="Ingresa los nombres de usuario separados por comas"
        >
          <Input.TextArea placeholder="usuario1, usuario2, usuario3" rows={3} />
        </Form.Item>

        <div className={styles.footer}>
          <Button onClick={handleCancel}>Cancelar</Button>
          <Button type="primary" htmlType="submit">
            Crear Grupo
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
