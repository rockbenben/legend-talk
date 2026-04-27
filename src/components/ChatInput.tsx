import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '12px 16px',
        borderTop: '1px solid var(--ant-color-border-secondary)',
      }}
    >
      <Input.TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={t('chat.inputPlaceholder')}
        disabled={disabled}
        autoSize={{ minRows: 1, maxRows: 6 }}
        style={{ flex: 1 }}
      />
      <Button
        type="primary"
        size="large"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        icon={<SendOutlined />}
        style={{ alignSelf: 'flex-end' }}
      >
        {t('chat.send')}
      </Button>
    </div>
  );
}
