import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useAdminInventory } from './useAdminInventory';
import adminClient from '../api/adminClient';

// Mock adminClient
vi.mock('../api/adminClient', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('useAdminInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch inventory successfully', async () => {
    const mockInventory = [
      { id: '1', name: 'Product 1', stock: 10 },
    ];
    (adminClient.get as Mock).mockResolvedValue({ data: mockInventory });

    const { result } = renderHook(() => useAdminInventory());

    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.inventory).toEqual(mockInventory);
    expect(result.current.error).toBeNull();
  });

  it('should update stock', async () => {
    const mockInventory = [{ id: '1', stock: 10 }];
    (adminClient.get as Mock).mockResolvedValue({ data: mockInventory });
    (adminClient.patch as Mock).mockResolvedValue({});

    const { result } = renderHook(() => useAdminInventory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateStock('1', 20);
    });

    expect(adminClient.patch).toHaveBeenCalledWith('/api/admin/products/1/stock', { stock: 20 });
    // Should re-fetch
    expect(adminClient.get).toHaveBeenCalledTimes(2);
  });
});
