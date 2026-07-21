import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export function createReservationToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashReservationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function reservationTokenMatches(token: string, storedHash: string): boolean {
  const actual = Buffer.from(hashReservationToken(token), 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
