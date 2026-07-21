const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function trimString(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

export function validateGuestName(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const name = trimString(value, 100);
  if (!name) return { ok: false, error: 'Nome é obrigatório (máx. 100 caracteres)' };
  return { ok: true, value: name };
}

export function validateGuestEmail(value: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: null };
  }
  if (typeof value !== 'string') return { ok: false, error: 'E-mail inválido' };
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > 255 || !EMAIL_RE.test(trimmed)) {
    return { ok: false, error: 'E-mail inválido' };
  }
  return { ok: true, value: trimmed };
}

export function validateMessage(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const msg = trimString(value, 1000);
  if (!msg) return { ok: false, error: 'Mensagem é obrigatória (máx. 1000 caracteres)' };
  return { ok: true, value: msg };
}

export function validateGuestsCount(value: unknown): { ok: true; value: number } | { ok: false; error: string } {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n < 1 || n > 20) {
    return { ok: false, error: 'Número de convidados deve ser entre 1 e 20' };
  }
  return { ok: true, value: n };
}

export function validateHttpsUrl(
  value: unknown,
  options: { allowEmpty?: boolean; maxLength?: number } = {}
): { ok: true; value: string | null } | { ok: false; error: string } {
  if ((value === null || value === undefined || value === '') && options.allowEmpty) {
    return { ok: true, value: null };
  }
  if (typeof value !== 'string' || value.length > (options.maxLength || 2048)) {
    return { ok: false, error: 'URL inválida' };
  }
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || !url.hostname) {
      return { ok: false, error: 'Use uma URL segura iniciada por https://' };
    }
    url.username = '';
    url.password = '';
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: 'URL inválida' };
  }
}
