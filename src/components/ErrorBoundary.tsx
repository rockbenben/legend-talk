import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import i18n from '../i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Extra action rendered under the retry button, only on the error screen. */
  afterRetry?: ReactNode;
  /**
   * For react-router's errorElement, which mounts only AFTER the error was
   * caught by the router — a boundary in that tree can never catch it itself.
   */
  error?: unknown;
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
    const propError = this.props.error === undefined ? null
      : this.props.error instanceof Error ? this.props.error
      : new Error(String(this.props.error));
    if (propError || this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const message = (propError || this.state.error)?.message;
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
            {message || i18n.t('common.unexpectedError')}
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
          {this.props.afterRetry}
        </div>
      );
    }
    return this.props.children;
  }
}
