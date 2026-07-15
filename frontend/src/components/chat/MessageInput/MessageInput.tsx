import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useChat } from '../../../hooks/useChat';
import styles from './MessageInput.module.scss';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, sendTyping } = useChat();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    if (!message.trim()) return;
    sendMessage(message.trim());
    setMessage('');
    setIsTyping(false);
    sendTyping(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className={styles.messageInput}>
      <input
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Escribí un mensaje…"
        className={styles.input}
      />
      <button onClick={handleSend} className={styles.sendBtn}>
        ➤
      </button>
    </div>
  );
};
