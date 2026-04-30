import { Card, Typography } from 'antd';
import { RegisterForm } from '../../components/auth/RegisterForm';
import styles from '../../styles/pages/AuthPage.module.scss';

const { Title, Text } = Typography;

export default function RegisterPage() {
  return (
    <div className={styles.authPage}>
      <div className={styles.container}>
        <div className={styles.branding}>
          <Title className={styles.brandTitle}>Chat App</Title>
          <Text className={styles.brandSubtitle}>
            Únete a nuestra comunidad
          </Text>
        </div>
        <Card className={styles.card} bordered={false}>
          <RegisterForm />
        </Card>
      </div>
    </div>
  );
}

