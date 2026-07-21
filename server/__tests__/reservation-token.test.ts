import { describe, expect, it } from 'vitest';
import {
  createReservationToken,
  hashReservationToken,
  reservationTokenMatches,
} from '../security/reservationToken.js';

describe('reservation confirmation tokens', () => {
  it('creates an opaque high-entropy token and stores only its hash', () => {
    const token = createReservationToken();
    const hash = hashReservationToken(token);

    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(token);
    expect(reservationTokenMatches(token, hash)).toBe(true);
  });

  it('rejects another reservation token', () => {
    const hash = hashReservationToken(createReservationToken());
    expect(reservationTokenMatches(createReservationToken(), hash)).toBe(false);
  });
});
