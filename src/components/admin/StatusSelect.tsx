import { useState } from 'react';
import { GiftStatus } from '@/types';
import { updateGiftStatus } from '@/lib/services/gifts';
import { cn } from '@/lib/utils';

interface StatusSelectProps {
  giftId: string;
  currentStatus: GiftStatus;
  onUpdate?: () => void;
}

export default function StatusSelect({ giftId, currentStatus, onUpdate }: StatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleChange = async (newStatus: GiftStatus) => {
    setLoading(true);
    setStatus(newStatus);
    try {
      await updateGiftStatus(giftId, newStatus);
      onUpdate?.();
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
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as GiftStatus)}
      disabled={loading}
      className={cn(
        'text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 ring-1 ring-inset cursor-pointer transition-all focus:ring-2 focus:ring-primary-500',
        colorClass,
        loading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <option value="disponivel">Disponível</option>
      <option value="reservado">Reservado</option>
      <option value="comprado">Comprado</option>
    </select>
  );
}
