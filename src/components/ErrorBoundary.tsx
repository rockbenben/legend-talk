import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import i18n from '../i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 16,
            padding: 32,
            textAlign: 'center',
            background: 'var(--lt-paper)',
            color: 'var(--lt-ink)',
            fontFamily: 'var(--lt-serif-body)',
          }}
        >
          <div style={{ fontSize: 32 }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, fontFamily: 'var(--lt-serif-display)' }}>
            {i18n.t('common.somethingWrong')}
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--lt-ink-soft)', maxWidth: 420 }}>
            {this.state.error?.message || i18n.t('common.unexpectedError')}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              border: 0,
              borderRadius: 2,
              padding: '8px 20px',
              fontSize: 14,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: 'var(--lt-madder)',
              color: 'var(--lt-paper)',
            }}
          >
            {i18n.t('chat.retry')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
