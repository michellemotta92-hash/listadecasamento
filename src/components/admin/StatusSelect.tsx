import { useEffect, useState } from 'react';
import { GiftStatus } from '@/types';
import { updateGiftStatus } from '@/lib/services/gifts';
import { cn } from '@/lib/utils';

interface StatusSelectProps {
  giftId: string;
  currentStatus: GiftStatus;
  onUpdate: () => void;
}

export default function StatusSelect({ giftId, currentStatus, onUpdate }: StatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const handleChange = async (newStatus: GiftStatus) => {
    setLoading(true);
    setError(false);
    const previousStatus = status;
    setStatus(newStatus);
    try {
      await updateGiftStatus(giftId, newStatus);
      onUpdate?.();
    } catch {
      setStatus(previousStatus);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const colorClass =
    status === 'disponivel'
      ? 'bg-slate-50 text-slate-700 ring-slate-200'
      : status === 'reservado'
        ? 'bg-gold-50 text-gold-700 ring-gold-100'
        : 'bg-sage-50 text-sage-700 ring-sage-100';

  return (
    <div className="space-y-1">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as GiftStatus)}
        disabled={loading}
        className={cn(
          'cursor-pointer rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset transition-all focus:ring-2 focus:ring-primary-500',
          colorClass,
          loading && 'cursor-not-allowed opacity-50',
          error && 'ring-red-200',
        )}
      >
        <option value="disponivel">Disponível</option>
        <option value="reservado">Reservado</option>
        <option value="comprado">Comprado</option>
      </select>
      {error && <p className="text-[10px] font-medium text-red-600">Erro ao salvar</p>}
    </div>
  );
}
