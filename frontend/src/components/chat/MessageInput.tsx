import { useState } from 'react';
import styles from '../../styles/components/MessageInput.module.scss';
import { useChat } from '../../hooks/useChat';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, sendTyping } = useChat();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (!isTyping && value) {
      setIsTyping(true);
      sendTyping(true);
    } else if (isTyping && !value) {
      setIsTyping(false);
      sendTyping(false);
    }

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
      setIsTyping(false);
      sendTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.messageInput}>
      <textarea
        placeholder="Aa"
        value={message}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        className={styles.input}
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className={styles.button}
        title="Enviar mensaje"
      >
        ➤
      </button>
    </div>
  );
};
