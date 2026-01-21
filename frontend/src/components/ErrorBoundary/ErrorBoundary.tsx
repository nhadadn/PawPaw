import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Si el fallback es un elemento válido de React, le inyectamos las props
      if (React.isValidElement(this.props.fallback)) {
        // @ts-expect-error - Inyectamos props adicionales dinámicamente
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return React.cloneElement(this.props.fallback as React.ReactElement<any>, {
          error: this.state.error,
          resetErrorBoundary: this.resetErrorBoundary,
        });
      }

      return this.props.fallback;
    }

    return this.props.children;
  }
}
