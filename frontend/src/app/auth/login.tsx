import { Card, Typography } from 'antd';
import { LoginForm } from '../../components/auth/LoginForm';
import styles from '../../styles/pages/AuthPage.module.scss';

const { Title, Text } = Typography;

export default function LoginPage() {
  return (
    <div className={styles.authPage}>
      <div className={styles.container}>
        <div className={styles.branding}>
          <Title className={styles.brandTitle}>Chat App</Title>
          <Text className={styles.brandSubtitle}>
            Conecta con tus amigos en tiempo real
          </Text>
        </div>
        <Card className={styles.card} bordered={false}>
          <LoginForm />
        </Card>
      </div>
    </div>
  );
}

