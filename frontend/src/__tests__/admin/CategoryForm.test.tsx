import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { CategoryForm } from '../../components/admin/CategoryForm';

describe('CategoryForm', () => {
  it('renders correctly', () => {
    render(
      <CategoryForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/nombre/i)).toBeDefined();
    expect(screen.getByLabelText(/descripción/i)).toBeDefined();
    expect(screen.getByLabelText(/imagen/i)).toBeDefined();
  });

  it('submits valid data as FormData', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <CategoryForm
        onSubmit={handleSubmit}
        onCancel={vi.fn()}
      />
    );

    // Fill form
    await user.type(screen.getByLabelText(/nombre/i), 'New Category');
    await user.type(screen.getByLabelText(/descripción/i), 'Category Description');

    // Upload file
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText(/imagen/i) as HTMLInputElement;
    await user.upload(input, file);

    // Submit
    await user.click(screen.getByRole('button', { name: /crear/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const formData = handleSubmit.mock.calls[0][0] as FormData;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('name')).toBe('New Category');
    expect(formData.get('description')).toBe('Category Description');
    expect(formData.get('image')).toBeInstanceOf(File);
  });
});
