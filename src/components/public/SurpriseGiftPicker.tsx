import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { GiftItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  gifts: GiftItem[];
}

export default function SurpriseGiftPicker({ gifts }: Props) {
  const { domain } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [budget, setBudget] = useState(100);
  const [revealed, setRevealed] = useState<GiftItem | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const availableGifts = useMemo(
    () => gifts.filter(g => g.status === 'disponivel'),
    [gifts]
  );

  const priceRange = useMemo(() => {
    if (availableGifts.length === 0) return { min: 0, max: 500 };
    const prices = availableGifts.map(g => g.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [availableGifts]);

  const matchingGifts = useMemo(
    () => availableGifts.filter(g => g.price <= budget),
    [availableGifts, budget]
  );

  const handleSurprise = () => {
    if (matchingGifts.length === 0) return;
    setIsFlipping(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * matchingGifts.length);
      setRevealed(matchingGifts[randomIndex]);
      setIsFlipping(false);
    }, 800);
  };

  const handleClose = () => {
    setIsOpen(false);
    setRevealed(null);
    setIsFlipping(false);
  };

  if (availableGifts.length === 0) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-sm font-medium shadow-soft hover:shadow-elegant transition-all duration-300"
      >
        <Sparkles className="w-4 h-4" />
        Presente Surpresa
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#faf8f5] rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1 text-[#a89e95] hover:text-[#4a3f38] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <Sparkles className="w-6 h-6 text-primary-400 mx-auto" />
                <h3 className="font-heading text-2xl font-light text-[#4a3f38]">
                  Presente Surpresa
                </h3>
                <p className="text-sm text-[#8a7e76] font-light">
                  Defina seu orcamento e deixe a magia escolher!
                </p>
              </div>

              {!revealed ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-[#a89e95] font-medium">
                      Orcamento: {formatCurrency(budget)}
                    </label>
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full accent-primary-500"
                    />
                    <div className="flex justify-between text-xs text-[#a89e95]">
                      <span>{formatCurrency(priceRange.min)}</span>
                      <span>{formatCurrency(priceRange.max)}</span>
                    </div>
                    <p className="text-xs text-[#8a7e76]">
                      {matchingGifts.length} presente{matchingGifts.length !== 1 ? 's' : ''} disponíve{matchingGifts.length !== 1 ? 'is' : 'l'}
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSurprise}
                    disabled={matchingGifts.length === 0 || isFlipping}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-sm shadow-soft hover:shadow-elegant transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isFlipping ? (
                      <motion.span
                        animate={{ rotateY: [0, 180, 360] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block"
                      >
                        ���
                      </motion.span>
                    ) : (
                      'Surpreenda-me!'
                    )}
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <div className="aspect-square max-w-[200px] mx-auto rounded-xl overflow-hidden shadow-soft bg-cream">
                    <img
                      src={revealed.image_url || ''}
                      alt={revealed.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.15em]">
                      {revealed.room}
                    </p>
                    <h4 className="font-heading text-xl font-medium text-[#4a3f38]">
                      {revealed.name}
                    </h4>
                    <p className="font-heading text-lg text-[#5a4f46] font-light">
                      {formatCurrency(revealed.price)}
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Link
                      to={`/${domain}/presentes/${revealed.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      Ver presente <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => { setRevealed(null); setIsFlipping(false); }}
                      className="px-5 py-2.5 border border-[#e0d0c8] rounded-full text-sm text-[#6a5d54] hover:bg-white transition-colors"
                    >
                      Tentar outro
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
