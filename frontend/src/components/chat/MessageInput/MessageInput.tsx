import { useState } from 'react';
import { Input, Button, Tooltip } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useChat } from '../../../hooks/useChat';
import styles from './MessageInput.module.scss';

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
  };

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
      sendTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.messageInput}>
      <Input.TextArea
        placeholder="Escribe un mensaje..."
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoSize={{ minRows: 1, maxRows: 4 }}
        className={styles.textarea}
      />
      <Tooltip title="Enviar (Enter)">
        <Button
          type="primary"
          shape="circle"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!message.trim()}
          className={styles.sendBtn}
        />
      </Tooltip>
    </div>
  );
};
