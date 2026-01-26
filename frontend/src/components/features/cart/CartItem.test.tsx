import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartItem } from './CartItem';
import { describe, it, expect, vi } from 'vitest';

describe('CartItem', () => {
  const item = {
    id: '1',
    name: 'Producto Test',
    price: 1000,
    image: 'image.jpg',
    quantity: 2,
  };

  it('renders name, price and quantity', () => {
    const onUpdate = vi.fn();
    const onRemove = vi.fn();
    render(
      <MemoryRouter>
        <CartItem item={item} onUpdateQuantity={onUpdate} onRemove={onRemove} />
      </MemoryRouter>
    );
    expect(screen.getByText('Producto Test')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('decreases quantity and disables at 1', () => {
    const onUpdate = vi.fn();
    const onRemove = vi.fn();
    render(
      <MemoryRouter>
        <CartItem item={{ ...item, quantity: 1 }} onUpdateQuantity={onUpdate} onRemove={onRemove} />
      </MemoryRouter>
    );
    const decBtn = screen.getByLabelText('Disminuir cantidad') as HTMLButtonElement;
    expect(decBtn.disabled).toBe(true);
  });

  it('calls update on increase and decrease', () => {
    const onUpdate = vi.fn();
    const onRemove = vi.fn();
    render(
      <MemoryRouter>
        <CartItem item={item} onUpdateQuantity={onUpdate} onRemove={onRemove} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText('Aumentar cantidad'));
    fireEvent.click(screen.getByLabelText('Disminuir cantidad'));
    expect(onUpdate).toHaveBeenCalledWith('1', 3);
    expect(onUpdate).toHaveBeenCalledWith('1', 1);
  });

  it('calls remove on button click', () => {
    const onUpdate = vi.fn();
    const onRemove = vi.fn();
    render(
      <MemoryRouter>
        <CartItem item={item} onUpdateQuantity={onUpdate} onRemove={onRemove} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByLabelText('Eliminar producto'));
    expect(onRemove).toHaveBeenCalledWith('1');
  });
});
