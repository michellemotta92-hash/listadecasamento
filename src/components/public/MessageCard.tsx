import { motion } from 'motion/react';
import { GuestMessage } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Quote } from 'lucide-react';

interface Props {
  message: GuestMessage;
  index: number;
}

export default function MessageCard({ message, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      className="glass-card p-6 rounded-xl shadow-soft hover:shadow-elegant transition-all duration-300 space-y-4"
    >
      <Quote className="w-5 h-5 text-primary-300" />
      <p className="text-[#5a4f46] leading-relaxed font-light">
        {message.message}
      </p>
      <div className="flex items-center justify-between pt-2 border-t border-[#e0d0c8]/30">
        <p className="font-heading text-sm font-medium text-primary-600">
          {message.guest_name}
        </p>
        <p className="text-[10px] text-[#a89e95] uppercase tracking-wider">
          {format(new Date(message.created_at), "dd MMM yyyy", { locale: ptBR })}
        </p>
      </div>
    </motion.div>
  );
}
