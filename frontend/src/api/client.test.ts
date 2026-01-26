import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  AxiosAdapter,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosRequestHeaders,
} from 'axios';
import apiClient from './client';

describe('apiClient interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    apiClient.defaults.headers = {} as AxiosRequestHeaders;
  });

  it('adds Authorization header from localStorage token', async () => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token: 'test-token' } }));

    const adapter: AxiosAdapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      expect(config.headers.Authorization).toBe('Bearer test-token');
      const response: AxiosResponse<{ ok: boolean }> = {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
      return response;
    });

    const original = apiClient.defaults.adapter;
    apiClient.defaults.adapter = adapter;
    try {
      const res = await apiClient.get('/ping');
      expect(res.status).toBe(200);
    } finally {
      apiClient.defaults.adapter = original;
    }
  });

  it('adds Idempotency-Key header for POST', async () => {
    const adapter: AxiosAdapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      expect(config.headers['Idempotency-Key']).toBeDefined();
      const response: AxiosResponse<{ ok: boolean }> = {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
      return response;
    });

    const original = apiClient.defaults.adapter;
    apiClient.defaults.adapter = adapter;
    try {
      const res = await apiClient.post('/items', { a: 1 });
      expect(res.status).toBe(200);
    } finally {
      apiClient.defaults.adapter = original;
    }
  });

  it('dispatches auth:unauthorized on 401', async () => {
    const listener = vi.fn();
    window.addEventListener('auth:unauthorized', listener);

    const adapter: AxiosAdapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      const error = {
        isAxiosError: true,
        config,
        toJSON: () => ({}),
        name: 'AxiosError',
        message: 'Unauthorized',
        response: { status: 401, statusText: 'Unauthorized', headers: {}, data: {} },
      } as AxiosError;
      throw error;
    });

    const original = apiClient.defaults.adapter;
    apiClient.defaults.adapter = adapter;
    try {
      await expect(apiClient.get('/me')).rejects.toBeTruthy();
      expect(listener).toHaveBeenCalled();
    } finally {
      apiClient.defaults.adapter = original;
      window.removeEventListener('auth:unauthorized', listener);
    }
  });
});
