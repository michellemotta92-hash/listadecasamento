import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useGifts } from '@/hooks/useGifts';
import GiftFilters from '@/components/public/GiftFilters';
import GiftCard from '@/components/public/GiftCard';
import SurpriseGiftPicker from '@/components/public/SurpriseGiftPicker';
import { motion } from 'motion/react';
import { Gift, Loader2 } from 'lucide-react';
import { getSiteConfig } from '@/lib/services/site-config';
import { PageTexts } from '@/types';

export default function GiftsPage() {
  const { gifts, loading } = useGifts();
  const [searchParams] = useSearchParams();
  const [texts, setTexts] = useState<PageTexts>({});

  useEffect(() => {
    getSiteConfig().then(c => setTexts(c.page_texts || {}));
  }, []);

  const room = searchParams.get('room') || '';
  const sort = searchParams.get('sort') || '';
  const featured = searchParams.get('featured') === '1';

  const filteredGifts = useMemo(() => {
    let result = [...gifts];
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
  }, [gifts, room, sort, featured]);

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

      <div className="flex flex-col items-center gap-4">
        <GiftFilters />
        {!loading && <SurpriseGiftPicker gifts={gifts} />}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : filteredGifts.length === 0 ? (
        <div className="text-center py-16 text-[#a89e95]">
          Nenhum presente encontrado para este filtro.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredGifts.map((gift, index) => (
            <GiftCard key={gift.id} gift={gift} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
