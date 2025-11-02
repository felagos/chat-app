import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

export default function App() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    } else {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  return null;
}
