import { describe, expect, it } from 'vitest';

import { selectAuthProvider } from './index';

describe('selectAuthProvider', () => {
  it('honors an explicit provider', () => {
    expect(selectAuthProvider('mock', 'https://api.citylens.dev', 'production')).toBe('mock');
    expect(selectAuthProvider('neon', 'http://localhost:8000', 'development')).toBe('neon');
  });

  it('uses Neon for production when the provider is omitted', () => {
    expect(selectAuthProvider(undefined, undefined, 'production')).toBe('neon');
  });

  it('uses Neon when local web development targets a deployed API', () => {
    expect(
      selectAuthProvider(
        undefined,
        'https://api.citylens.dev',
        'development',
      ),
    ).toBe('neon');
  });

  it('keeps mock auth for a local development API', () => {
    expect(
      selectAuthProvider(undefined, 'http://localhost:8000', 'development'),
    ).toBe('mock');
  });
});
