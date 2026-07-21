import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useGifts } from '@/hooks/useGifts';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import GiftFilters from '@/components/public/GiftFilters';
import GiftCard from '@/components/public/GiftCard';
import SurpriseGiftPicker from '@/components/public/SurpriseGiftPicker';
import { GiftCardSkeleton } from '@/components/ui/Skeleton';
import { motion } from 'motion/react';
import { Gift, Loader2, Search, AlertCircle } from 'lucide-react';

export default function GiftsPage() {
  const { data: gifts = [], isLoading, error, refetch } = useGifts();
  const { data: config } = useSiteConfig();
  const texts = config?.page_texts || {};
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const room = searchParams.get('room') || '';
  const sort = searchParams.get('sort') || '';
  const featured = searchParams.get('featured') === '1';

  const filteredGifts = useMemo(() => {
    let result = [...gifts];
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((g) => g.name.toLowerCase().includes(q));
    }
    if (room) {
      result = result.filter(g => g.room === room);
    }
    if (featured) {
      result = result.filter(g => g.is_featured);
    }
    if (sort === 'asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'desc') {
      result.sort((a, b) => b.price - a.price);
    }
    return result;
  }, [gifts, room, sort, featured, search]);

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[#a89e95] font-medium">{texts.gifts_subtitle || 'Nossa lista'}</p>
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-[#4a3f38] tracking-wide">
          {texts.gifts_title || 'Lista de Presentes'}
        </h2>
        <div className="divider-ornament" />
        <p className="text-[#8a7e76] max-w-xl mx-auto leading-relaxed font-light text-lg">
          {texts.gifts_description || 'Montamos nossa casa com muito carinho. Se desejar nos presentear, escolhemos alguns itens que adoraríamos ter.'}
        </p>
      </motion.div>

      <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a89e95]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar presente por nome..."
            aria-label="Buscar presente"
            className="w-full pl-11 pr-4 py-3 rounded-full border border-[#e0d0c8] bg-white/80 text-[#3d3530] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <GiftFilters />
        {!isLoading && <SurpriseGiftPicker gifts={gifts} />}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <GiftCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-[#8a7e76]">Erro ao carregar presentes.</p>
          <button
            onClick={() => refetch()}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      ) : filteredGifts.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Gift className="w-10 h-10 mx-auto text-[#d0c8c0]" />
          <p className="text-[#8a7e76]">Nenhum presente encontrado.</p>
          <button
            onClick={() => setSearch('')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          <p className="text-center text-xs text-[#a89e95]">
            {filteredGifts.length} presente{filteredGifts.length !== 1 ? 's' : ''} encontrado{filteredGifts.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredGifts.map((gift, index) => (
              <GiftCard key={gift.id} gift={gift} index={index} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
