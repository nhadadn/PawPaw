import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProductForm } from '../../components/admin/ProductForm';
import type { AdminCategory } from '../../types/admin';
import userEvent from '@testing-library/user-event';

const mockCategories: AdminCategory[] = [
  { id: '1', name: 'T-Shirts', description: 'T-Shirts desc', image: '' },
  { id: '2', name: 'Hoodies', description: 'Hoodies desc', image: '' },
];

describe('ProductForm', () => {
  it('renders correctly', () => {
    render(<ProductForm onSubmit={vi.fn()} onCancel={vi.fn()} categories={mockCategories} />);
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stock/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/imágenes/i)).toBeInTheDocument();
  });

  it('submits valid data as FormData', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<ProductForm onSubmit={handleSubmit} onCancel={vi.fn()} categories={mockCategories} />);

    // Fill form
    await user.type(screen.getByLabelText(/nombre/i), 'New Product');
    await user.type(screen.getByLabelText(/descripción/i), 'Product Description');
    await user.type(screen.getByLabelText(/precio/i), '150');
    await user.type(screen.getByLabelText(/stock/i), '20');
    await user.selectOptions(screen.getByLabelText(/categoría/i), '1');

    // Upload file
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText(/imágenes/i) as HTMLInputElement;
    await user.upload(input, file);

    // Submit
    await user.click(screen.getByRole('button', { name: /crear/i }));

    await waitFor(
      () => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );

    const formData = handleSubmit.mock.calls[0][0] as FormData;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('name')).toBe('New Product');
    expect(formData.get('description')).toBe('Product Description');
    expect(formData.get('priceCents')).toBe('15000'); // 150 * 100
    expect(formData.get('categoryId')).toBe('1');
    expect(formData.get('initialStock')).toBe('20');
    expect(formData.get('images')).toBeInstanceOf(File);

    // Check imageOrder
    const imageOrder = formData.get('imageOrder');
    expect(imageOrder).toBeTruthy();
    expect(JSON.parse(imageOrder as string)).toHaveLength(1);
  }, 15000);
});
