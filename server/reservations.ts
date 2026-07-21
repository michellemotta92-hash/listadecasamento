import { pool } from './db.js';
import {
  createReservationToken,
  hashReservationToken,
  reservationTokenMatches,
} from './security/reservationToken.js';

export async function expireOverdueReservations(): Promise<{ expired: number; released: number }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const expiredResult = await client.query<{ gift_item_id: string }>(
      `UPDATE gift_reservations SET status = 'expirada', updated_at = NOW()
       WHERE status = 'pendente' AND expires_at < NOW()
       RETURNING gift_item_id`
    );
    const giftIds = [...new Set(expiredResult.rows.map((row) => row.gift_item_id))];
    let released = 0;
    if (giftIds.length > 0) {
      const releaseResult = await client.query(
        `UPDATE gift_items SET status = 'disponivel', updated_at = NOW()
         WHERE status = 'reservado' AND id = ANY($1::uuid[])
           AND id NOT IN (
             SELECT gift_item_id FROM gift_reservations WHERE status = 'pendente'
           )`,
        [giftIds]
      );
      released = releaseResult.rowCount ?? 0;
    }
    await client.query('COMMIT');
    return { expired: expiredResult.rowCount ?? 0, released };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export interface CreateReservationInput {
  giftId: string;
  tenantId: string;
  guestName: string;
  guestEmail: string | null;
}

export type CreateReservationResult =
  | { ok: true; reservation: Record<string, unknown> & { confirmation_token: string } }
  | { ok: false; error: string; status: number };

export async function createReservationTransaction(
  input: CreateReservationInput
): Promise<CreateReservationResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const giftResult = await client.query<{ id: string; status: string; tenant_id: string }>(
      'SELECT id, status, tenant_id FROM gift_items WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
      [input.giftId, input.tenantId]
    );
    const gift = giftResult.rows[0];
    if (!gift) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Presente não encontrado', status: 404 };
    }
    if (gift.status !== 'disponivel') {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Este presente não está disponível', status: 409 };
    }

    await client.query(
      "UPDATE gift_items SET status = 'reservado', updated_at = NOW() WHERE id = $1 AND tenant_id = $2",
      [input.giftId, input.tenantId]
    );

    const confirmationToken = createReservationToken();
    const expiresAt = new Date(Date.now() + 20 * 60_000).toISOString();
    const reservationResult = await client.query<Record<string, unknown>>(
      `INSERT INTO gift_reservations
         (gift_item_id, tenant_id, guest_name, guest_email, status, expires_at, confirmation_token_hash)
       VALUES ($1, $2, $3, $4, 'pendente', $5, $6)
       RETURNING id, gift_item_id, tenant_id, guest_name, guest_email, status, expires_at, created_at, updated_at`,
      [
        input.giftId,
        input.tenantId,
        input.guestName,
        input.guestEmail,
        expiresAt,
        hashReservationToken(confirmationToken),
      ]
    );
    await client.query('COMMIT');
    return {
      ok: true,
      reservation: { ...reservationResult.rows[0], confirmation_token: confirmationToken },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export type ConfirmReservationResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function confirmReservationTransaction(input: {
  reservationId: string;
  tenantId: string;
  token: string;
}): Promise<ConfirmReservationResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{
      id: string;
      gift_item_id: string;
      status: string;
      confirmation_token_hash: string | null;
      expires_at: string | null;
    }>(
      `SELECT id, gift_item_id, status, confirmation_token_hash, expires_at
         FROM gift_reservations
        WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
      [input.reservationId, input.tenantId]
    );
    const reservation = result.rows[0];
    if (!reservation || !reservation.confirmation_token_hash) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Reserva não encontrada', status: 404 };
    }
    if (!reservationTokenMatches(input.token, reservation.confirmation_token_hash)) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Confirmação inválida', status: 403 };
    }
    if (reservation.status === 'confirmada') {
      await client.query('COMMIT');
      return { ok: true };
    }
    if (reservation.status !== 'pendente' || (reservation.expires_at && new Date(reservation.expires_at) < new Date())) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'Esta reserva expirou', status: 409 };
    }

    await client.query(
      `UPDATE gift_reservations
          SET status = 'confirmada', confirmation_token_hash = NULL, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2`,
      [reservation.id, input.tenantId]
    );
    await client.query(
      `UPDATE gift_items SET status = 'comprado', updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2`,
      [reservation.gift_item_id, input.tenantId]
    );
    await client.query('COMMIT');
    return { ok: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
