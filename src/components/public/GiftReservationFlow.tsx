import { useState, useEffect, useCallback } from 'react';
import { GiftItem } from '@/types';
import { createReservation, confirmReservation } from '@/lib/services/reservations';
import Modal from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Check, ExternalLink, Loader2 } from 'lucide-react';

interface Props {
  gift: GiftItem;
  onStatusChange?: () => void;
}

export default function GiftReservationFlow({ gift, onStatusChange }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [reservationStatus, setReservationStatus] = useState<'idle' | 'reserving' | 'reserved' | 'confirming' | 'confirmed'>('idle');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    if (gift.status === 'comprado') {
      setReservationStatus('confirmed');
      localStorage.setItem(`reservation_${gift.id}`, 'confirmed');
      return;
    }
    if (gift.status === 'reservado') {
      const saved = localStorage.getItem(`reservation_${gift.id}`);
      if (saved === 'reserved' || saved === 'confirmed') {
        setReservationStatus(saved as any);
      }
      return;
    }
    const saved = localStorage.getItem(`reservation_${gift.id}`);
    if (saved && gift.status === 'disponivel') {
      localStorage.removeItem(`reservation_${gift.id}`);
      setReservationStatus('idle');
    }
  }, [gift.id, gift.status]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isModalOpen && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (isModalOpen && countdown === 0) {
      window.open(gift.store_link || '#', '_blank');
      setIsModalOpen(false);
      setReservationStatus('reserved');
      localStorage.setItem(`reservation_${gift.id}`, 'reserved');
      onStatusChange?.();
    }
    return () => clearTimeout(timer);
  }, [isModalOpen, countdown, gift.store_link, gift.id, onStatusChange]);

  const handleBuyClick = useCallback(async () => {
    setReservationStatus('reserving');
    await createReservation(gift.id);
    setIsModalOpen(true);
    setCountdown(10);
  }, [gift.id]);

  const handleConfirmPurchase = useCallback(async () => {
    setIsConfirmModalOpen(false);
    setReservationStatus('confirming');
    await confirmReservation(gift.id);
    setReservationStatus('confirmed');
    localStorage.setItem(`reservation_${gift.id}`, 'confirmed');
    onStatusChange?.();
  }, [gift.id, onStatusChange]);

  if (gift.status === 'comprado' || reservationStatus === 'confirmed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-sage-50 border border-sage-100 rounded-lg p-6 text-center"
      >
        <Check className="w-8 h-8 text-sage-600 mx-auto mb-2" />
        <p className="text-sage-700 font-medium font-heading text-lg">Este item já foi comprado.</p>
        <p className="text-sm text-sage-600 mt-1 font-light">Agradecemos o carinho!</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {reservationStatus === 'idle' && gift.status === 'disponivel' && (
          <motion.button
            key="buy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBuyClick}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-8 rounded-full transition-all duration-300 shadow-soft hover:shadow-elegant active:scale-[0.98] flex items-center justify-center gap-2 uppercase text-sm tracking-wider"
          >
            <ShoppingBag className="w-5 h-5" />
            Comprar Presente
          </motion.button>
        )}

        {reservationStatus === 'reserving' && (
          <motion.button
            key="reserving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            disabled
            className="w-full bg-primary-400 text-white font-medium py-4 px-8 rounded-full cursor-not-allowed flex items-center justify-center gap-2 uppercase text-sm tracking-wider"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Reservando...
          </motion.button>
        )}

        {(reservationStatus === 'reserved' || (gift.status === 'reservado' && reservationStatus !== 'confirming')) && (
          <motion.div
            key="reserved"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="bg-blush/50 border border-blush rounded-lg p-4 text-sm text-primary-800">
              Você reservou este item. A reserva expira em 20 minutos.
            </div>
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="w-full bg-sage-600 hover:bg-sage-700 text-white font-medium py-4 px-8 rounded-full transition-all duration-300 shadow-soft hover:shadow-elegant active:scale-[0.98] flex items-center justify-center gap-2 uppercase text-sm tracking-wider"
            >
              <Check className="w-5 h-5" />
              Já comprei
            </button>
            <a
              href={gift.store_link || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1 w-full text-[#8a7e76] hover:text-primary-600 text-sm py-2 transition-colors duration-200"
            >
              <ExternalLink className="w-4 h-4" />
              Ir para a loja novamente
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redirect countdown modal */}
      <Modal isOpen={isModalOpen} onClose={() => {}}>
        <div className="text-center space-y-6">
          <h3 className="font-heading text-2xl font-light text-[#3d3530]">Redirecionando...</h3>
          <p className="text-[#7a6e65] font-light">
            Você será levado para a loja <strong className="font-medium">{gift.store_name}</strong> para finalizar a compra.
          </p>
          <div className="relative w-20 h-20 mx-auto">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#f0d4dc" strokeWidth="4" />
              <motion.circle
                cx="40" cy="40" r="36" fill="none" stroke="#b06a82" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={226}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: 226 }}
                transition={{ duration: 10, ease: 'linear' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-light font-heading text-primary-600">
              {countdown}
            </span>
          </div>
          <div className="bg-blush/30 text-primary-800 p-4 rounded-lg text-sm font-light">
            <strong className="font-medium">Importante:</strong> Após a compra, volte a esta página e clique em "Já comprei" para confirmar.
          </div>
        </div>
      </Modal>

      {/* Confirm purchase modal */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <div className="text-center space-y-6">
          <h3 className="font-heading text-2xl font-light text-[#3d3530]">Confirmar Compra</h3>
          <p className="text-[#7a6e65] font-light">
            Você confirma que já realizou a compra na loja?
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-6 py-2.5 rounded-full border border-[#e0d0c8] text-[#6a5d54] hover:bg-[#f5f0e8] font-medium transition-all duration-300 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmPurchase}
              className="px-6 py-2.5 rounded-full bg-sage-600 hover:bg-sage-700 text-white font-medium transition-all duration-300 shadow-soft text-sm"
            >
              Sim, já comprei
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
