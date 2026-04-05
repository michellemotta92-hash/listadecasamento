import { motion } from 'motion/react';
import { useGifts } from '@/hooks/useGifts';
import { formatCurrency } from '@/lib/utils';
import { Gift, TrendingUp } from 'lucide-react';

export default function RegistryProgress() {
  const { gifts, loading } = useGifts();

  if (loading || gifts.length === 0) return null;

  const total = gifts.length;
  const bought = gifts.filter(g => g.status === 'comprado').length;
  const reserved = gifts.filter(g => g.status === 'reservado').length;
  const percentage = Math.round(((bought + reserved) / total) * 100);
  const totalValue = gifts
    .filter(g => g.status === 'comprado')
    .reduce((sum, g) => sum + g.price, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="glass-card p-8 max-w-lg mx-auto shadow-soft rounded-2xl text-center space-y-5"
    >
      <div className="flex items-center justify-center gap-2">
        <Gift className="w-4 h-4 text-primary-400" />
        <p className="text-xs uppercase tracking-[0.2em] text-[#a89e95] font-medium">
          Progresso da Lista
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full h-3 bg-[#f0ece6] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
            className="h-full rounded-full bg-gradient-to-r from-primary-400 to-sage-400"
          />
        </div>
        <p className="text-sm text-[#7a6e65]">
          <span className="font-heading text-lg font-medium text-[#4a3f38]">{bought + reserved}</span>
          {' '}de{' '}
          <span className="font-heading text-lg font-medium text-[#4a3f38]">{total}</span>
          {' '}presentes escolhidos
        </p>
      </div>

      {totalValue > 0 && (
        <div className="flex items-center justify-center gap-2 text-sage-600">
          <TrendingUp className="w-4 h-4" />
          <p className="text-sm font-medium">
            {formatCurrency(totalValue)} em presentes confirmados
          </p>
        </div>
      )}
    </motion.div>
  );
}
