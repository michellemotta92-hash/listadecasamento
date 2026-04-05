import { Link, useParams } from 'react-router';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { GiftItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface GiftCardProps {
  gift: GiftItem;
  index: number;
}

export default function GiftCard({ gift, index }: GiftCardProps) {
  const { domain } = useParams();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
    >
      <Link
        to={`/${domain}/presentes/${gift.id}`}
        className={`group block bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[#e0d0c8]/30 shadow-soft hover:shadow-elegant transition-all duration-500 ${
          gift.status !== 'disponivel' ? 'opacity-75' : ''
        }`}
      >
        <div className="aspect-square overflow-hidden relative bg-cream">
          <img
            src={gift.image_url || ''}
            alt={gift.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {gift.is_featured && gift.status === 'disponivel' && (
            <div className="absolute top-3 left-3 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500" /> Desejado
            </div>
          )}
          {gift.status === 'reservado' && (
            <div className="absolute top-3 right-3 bg-blush text-primary-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Reservado
            </div>
          )}
          {gift.status === 'comprado' && (
            <div className="absolute top-3 right-3 bg-sage-100 text-sage-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Comprado
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          <div className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.15em]">
            {gift.room}
          </div>
          <h3 className="font-heading text-base md:text-lg font-medium text-[#4a3f38] leading-tight group-hover:text-primary-700 transition-colors duration-200">
            {gift.name}
          </h3>
          <p className="text-base text-[#5a4f46] font-light tracking-tight font-heading">
            {formatCurrency(gift.price)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
