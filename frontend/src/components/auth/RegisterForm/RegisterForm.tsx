import { Form, Input, Button, Alert, Typography } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../../hooks/useAuth';
import styles from './RegisterForm.module.scss';

const { Title, Text } = Typography;

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterForm = () => {
  const { register, isLoading, error } = useAuth();

  const onFinish = (values: RegisterFormValues) => {
    register(values.username, values.email, values.password);
  };

  return (
    <div className={styles.container}>
      <Title level={2} className={styles.title}>
        Crear Cuenta
      </Title>

      {error && (
        <Alert
          type="error"
          message={error instanceof Error ? error.message : 'Error al registrarse'}
          showIcon
          className={styles.alert}
        />
      )}

      <Form<RegisterFormValues>
        layout="vertical"
        onFinish={onFinish}
        size="large"
        autoComplete="off"
      >
        <Form.Item
          name="username"
          label="Nombre de usuario"
          rules={[
            { required: true, message: 'El nombre de usuario es requerido' },
            { min: 3, message: 'Mínimo 3 caracteres' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Mi usuario"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'El email es requerido' },
            { type: 'email', message: 'Ingresa un email válido' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="tu@email.com"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Contraseña"
          rules={[
            { required: true, message: 'La contraseña es requerida' },
            { min: 6, message: 'Mínimo 6 caracteres' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="••••••••"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirmar Contraseña"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Confirma tu contraseña' },
            ({ getFieldValue }) => ({
              validator(_rule, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Las contraseñas no coinciden'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="••••••••"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item className={styles.submitItem}>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Registrarse
          </Button>
        </Form.Item>
      </Form>

      <Text className={styles.link}>
        ¿Ya tienes cuenta? <a href="/auth/login">Inicia sesión aquí</a>
      </Text>
    </div>
  );
};
