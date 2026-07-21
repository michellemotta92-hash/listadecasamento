import { describe, it, expect } from 'vitest';
import {
  validateGuestName,
  validateGuestEmail,
  validateMessage,
  validateGuestsCount,
  validateHttpsUrl,
} from '../validation.js';

describe('validateGuestName', () => {
  it('accepts valid name', () => {
    expect(validateGuestName('  Maria  ')).toEqual({ ok: true, value: 'Maria' });
  });
  it('rejects empty', () => {
    expect(validateGuestName('')).toEqual({ ok: false, error: expect.any(String) });
  });
});

describe('validateGuestEmail', () => {
  it('allows empty', () => {
    expect(validateGuestEmail('')).toEqual({ ok: true, value: null });
  });
  it('validates format', () => {
    expect(validateGuestEmail('a@b.com')).toEqual({ ok: true, value: 'a@b.com' });
    expect(validateGuestEmail('invalid')).toEqual({ ok: false, error: expect.any(String) });
  });
});

describe('validateMessage', () => {
  it('requires message', () => {
    expect(validateMessage('Olá!')).toEqual({ ok: true, value: 'Olá!' });
    expect(validateMessage('')).toEqual({ ok: false, error: expect.any(String) });
  });
});

describe('validateGuestsCount', () => {
  it('accepts 1-20', () => {
    expect(validateGuestsCount(3)).toEqual({ ok: true, value: 3 });
    expect(validateGuestsCount(0)).toEqual({ ok: false, error: expect.any(String) });
    expect(validateGuestsCount(21)).toEqual({ ok: false, error: expect.any(String) });
  });
});

describe('validateHttpsUrl', () => {
  it('allows only https links', () => {
    expect(validateHttpsUrl('https://loja.example/item').ok).toBe(true);
    expect(validateHttpsUrl('javascript:alert(1)').ok).toBe(false);
    expect(validateHttpsUrl('http://loja.example/item').ok).toBe(false);
  });

  it('supports an optional empty value', () => {
    expect(validateHttpsUrl('', { allowEmpty: true })).toEqual({ ok: true, value: null });
  });
});
