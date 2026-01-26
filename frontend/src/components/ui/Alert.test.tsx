import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders with title and children', () => {
    render(<Alert title="Info">Mensaje</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Mensaje')).toBeInTheDocument();
  });

  it('renders success variant', () => {
    render(<Alert variant="success">OK</Alert>);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders warning variant', () => {
    render(<Alert variant="warning">Cuidado</Alert>);
    expect(screen.getByText('Cuidado')).toBeInTheDocument();
  });

  it('renders error variant', () => {
    render(<Alert variant="error">Error</Alert>);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
