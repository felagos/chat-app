import { useState } from 'react';
import styles from '../../styles/components/MessageInput.module.scss';
import { useChat } from '../../hooks/useChat';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, sendTyping } = useChat();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (!isTyping && value) {
      setIsTyping(true);
      sendTyping(true);
    } else if (isTyping && !value) {
      setIsTyping(false);
      sendTyping(false);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message, 'text');
      setMessage('');
      setIsTyping(false);
      sendTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.messageInput}>
      <input
        type="text"
        placeholder="Escribe un mensaje..."
        value={message}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        className={styles.input}
      />
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className={styles.button}
      >
        ➤
      </button>
    </div>
  );
};
