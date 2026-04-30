import { Form, Input, Button, Alert, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../../hooks/useAuth';
import styles from './LoginForm.module.scss';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginForm = () => {
  const { login, isLoading, error } = useAuth();

  const onFinish = (values: LoginFormValues) => {
    login(values.email, values.password);
  };

  return (
    <div className={styles.container}>
      <Title level={2} className={styles.title}>
        Iniciar Sesión
      </Title>

      {error && (
        <Alert
          type="error"
          message={error instanceof Error ? error.message : 'Error al iniciar sesión'}
          showIcon
          className={styles.alert}
        />
      )}

      <Form<LoginFormValues>
        layout="vertical"
        onFinish={onFinish}
        size="large"
        autoComplete="off"
      >
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
          rules={[{ required: true, message: 'La contraseña es requerida' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="••••••••"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item className={styles.submitItem}>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Iniciar Sesión
          </Button>
        </Form.Item>
      </Form>

      <Text className={styles.link}>
        ¿No tienes cuenta? <a href="/auth/register">Regístrate aquí</a>
      </Text>
    </div>
  );
};
