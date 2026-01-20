import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { describe, it, expect } from 'vitest';

describe('AdminSidebar', () => {
  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <AdminSidebar />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Categorías')).toBeInTheDocument();
    expect(screen.getByText('Órdenes')).toBeInTheDocument();
    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(
      <BrowserRouter>
        <AdminSidebar />
      </BrowserRouter>
    );

    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
  });
});
