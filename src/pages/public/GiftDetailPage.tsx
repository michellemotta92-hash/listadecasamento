import { useParams, Link } from 'react-router';
import { useGift } from '@/hooks/useGifts';
import GiftReservationFlow from '@/components/public/GiftReservationFlow';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Palette } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function GiftDetailPage() {
  const { domain, id } = useParams();
  const { gift, loading, refresh } = useGift(id!);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!gift) {
    return (
      <div className="text-center py-32">
        <h2 className="font-heading text-2xl text-[#4a3f38] mb-2">Presente não encontrado</h2>
        <p className="text-[#8a7e76] mb-6">Este item pode ter sido removido.</p>
        <Link
          to={`/${domain}/presentes`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          &larr; Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        to={`/${domain}/presentes`}
        className="inline-flex items-center gap-2 text-sm text-[#a89e95] hover:text-primary-600 transition-colors duration-200 mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Voltar para a lista
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card overflow-hidden flex flex-col md:flex-row shadow-elegant"
      >
        {/* Image */}
        <div className="md:w-1/2 aspect-square relative bg-cream">
          <img
            src={gift.image_url || 'https://picsum.photos/seed/gift/800/800'}
            alt={gift.name}
            className={`w-full h-full object-cover ${gift.status !== 'disponivel' ? 'grayscale-[0.3] opacity-90' : ''}`}
            referrerPolicy="no-referrer"
          />
          {gift.status === 'reservado' && (
            <div className="absolute top-4 left-4 bg-blush text-primary-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-sm">
              Reservado
            </div>
          )}
          {gift.status === 'comprado' && (
            <div className="absolute top-4 left-4 bg-sage-100 text-sage-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-sm">
              Já Comprado
            </div>
          )}
        </div>

        {/* Details */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-6">
          <div>
            <div className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.2em] mb-3">
              {gift.room}
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-light text-[#3d3530] leading-tight tracking-wide">
              {gift.name}
            </h1>
            <p className="mt-4 font-heading text-3xl text-[#4a3f38] font-light tracking-tight">
              {formatCurrency(gift.price)}
            </p>
          </div>

          {gift.color && (
            <div className="flex items-center gap-2 text-sm text-[#8a7e76]">
              <Palette className="w-4 h-4" />
              Cor/Variação: <span className="text-[#5a4f46] font-medium">{gift.color}</span>
            </div>
          )}

          <div className="text-[#7a6e65] leading-relaxed whitespace-pre-line font-light">
            {gift.description || 'Um presente especial escolhido com muito carinho para compor o nosso novo lar.'}
          </div>

          <div className="pt-6 border-t border-[#e0d0c8]/50 mt-auto">
            <GiftReservationFlow gift={gift} onStatusChange={refresh} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
