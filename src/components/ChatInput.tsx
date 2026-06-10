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
        gap: 12,
        alignItems: 'flex-end',
        padding: '10px 16px 16px',
      }}
    >
      <div className="lt-ledger" style={{ flex: 1, minWidth: 0 }}>
        <Input.TextArea
          variant="borderless"
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
          style={{ paddingInlineStart: 0 }}
        />
      </div>
      <Button
        className="lt-send"
        type="primary"
        size="large"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        icon={<SendOutlined className="rtl:-scale-x-100" />}
      >
        {t('chat.send')}
      </Button>
    </div>
  );
}
