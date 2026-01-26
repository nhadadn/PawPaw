import { describe, it, expect } from 'vitest';
import { useAdminStore } from './adminStore';

describe('adminStore', () => {
  it('initial state', () => {
    const state = useAdminStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('login and logout', () => {
    useAdminStore.getState().login('t', { id: '1', email: 'a@b.com', name: 'Admin' });
    expect(useAdminStore.getState().isAuthenticated).toBe(true);
    expect(useAdminStore.getState().token).toBe('t');
    expect(useAdminStore.getState().user?.id).toBe('1');

    useAdminStore.getState().logout();
    expect(useAdminStore.getState().isAuthenticated).toBe(false);
  });
});
