import { getImageUrl } from './utils';
import { vi } from 'vitest';

describe('getImageUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, VITE_API_URL: 'http://localhost:4000/api' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return empty string for null or undefined', () => {
    expect(getImageUrl(null)).toBe('');
    expect(getImageUrl(undefined)).toBe('');
  });

  it('should return original url if it starts with http', () => {
    expect(getImageUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg');
    expect(getImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
  });

  it('should return original url if it is a data uri or blob', () => {
    expect(getImageUrl('data:image/png;base64,...')).toBe('data:image/png;base64,...');
    expect(getImageUrl('blob:http://localhost:3000/...')).toBe('blob:http://localhost:3000/...');
  });

  it('should append base url to relative path', () => {
    // Mocking behavior of getImageUrl which strips /api from VITE_API_URL
    // VITE_API_URL = http://localhost:4000/api -> Base = http://localhost:4000
    expect(getImageUrl('/uploads/test.jpg')).toBe('http://localhost:4000/uploads/test.jpg');
  });

  it('should handle paths without leading slash', () => {
    expect(getImageUrl('uploads/test.jpg')).toBe('http://localhost:4000/uploads/test.jpg');
  });
});
