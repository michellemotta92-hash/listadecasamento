import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { motion } from 'motion/react';
import { Calendar, MapPin, Gift, Heart } from 'lucide-react';
import { getSiteConfig } from '@/lib/services/site-config';
import { SiteConfig } from '@/types';
import WeddingCountdown from '@/components/public/WeddingCountdown';
import RegistryProgress from '@/components/public/RegistryProgress';

function formatEventDate(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return '12 de Outubro de 2026\nàs 16:00';
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const [year, month, day] = dateStr.split('-').map(Number);
  const time = timeStr || '16:00';
  return `${day} de ${months[month - 1]} de ${year}\nàs ${time}`;
}

function formatLocation(location?: string): string {
  if (!location) return 'Fazenda Paraíso\nSão Paulo, SP';
  // Split on comma to create line break between venue and city
  const parts = location.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    return parts[0] + '\n' + parts.slice(1).join(', ');
  }
  return location;
}

export default function HomePage() {
  const { domain } = useParams();
  const [heroImage, setHeroImage] = useState('https://picsum.photos/seed/wedding-elegant/1920/1080');
  const [config, setConfig] = useState<SiteConfig>({});

  useEffect(() => {
    getSiteConfig().then(c => {
      setConfig(c);
      if (c.hero_image_url) setHeroImage(c.hero_image_url);
    });
  }, []);

  const coupleName = config.couple_name || 'Mi & John';
  const eventDateStr = formatEventDate(config.event_date, config.event_time);
  const locationStr = formatLocation(config.event_location);
  const t = config.page_texts || {};

  return (
    <div className="flex flex-col items-center space-y-24">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center space-y-6 max-w-2xl mx-auto"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Heart className="w-6 h-6 text-primary-400 mx-auto mb-6" />
        </motion.div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#a89e95] font-medium">{t.home_subtitle || 'Estamos nos casando'}</p>
        <h2 className="font-script text-6xl md:text-8xl lg:text-9xl text-primary-700 leading-none">
          {coupleName}
        </h2>
        <div className="divider-ornament" />
        <p className="font-body text-lg text-[#7a6e65] leading-relaxed font-light max-w-lg mx-auto">
          {t.home_description || 'Estamos muito felizes em compartilhar esse momento tão especial com vocês. Aqui você encontra todas as informações sobre o nosso grande dia.'}
        </p>
      </motion.div>

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative w-full max-w-5xl aspect-[21/9] rounded-2xl overflow-hidden shadow-elegant"
      >
        <img
          src={heroImage}
          alt="Casal"
          className="object-cover w-full h-full"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3d3530]/15 via-transparent to-transparent" />
      </motion.div>

      {/* Countdown */}
      <WeddingCountdown eventDate={config.event_date} eventTime={config.event_time} />

      {/* Registry Progress */}
      <RegistryProgress />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        {[
          {
            icon: Calendar,
            title: 'Quando',
            content: eventDateStr,
            delay: 0.4,
          },
          {
            icon: MapPin,
            title: 'Onde',
            content: locationStr,
            delay: 0.5,
          },
          {
            icon: Gift,
            title: 'Presentes',
            content: t.home_gifts_card || 'Veja nossa lista de\npresentes sugeridos.',
            delay: 0.6,
            link: `/${domain}/presentes`,
          },
        ].map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="glass-card p-8 text-center space-y-4 shadow-soft hover:shadow-elegant transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-blush/50 flex items-center justify-center mx-auto">
              <card.icon className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-heading text-xl font-medium text-[#4a3f38]">{card.title}</h3>
            <p className="text-[#8a7e76] whitespace-pre-line leading-relaxed font-light">{card.content}</p>
            {card.link && (
              <Link
                to={card.link}
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm tracking-wide uppercase transition-colors duration-200"
              >
                Ver lista &rarr;
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
