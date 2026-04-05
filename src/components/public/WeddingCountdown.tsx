import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_DATE = '2026-10-12';
const DEFAULT_TIME = '16:00';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(weddingDate: Date): TimeLeft {
  const diff = Math.max(0, weddingDate.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="glass-card w-20 h-20 md:w-24 md:h-24 flex items-center justify-center shadow-soft rounded-xl overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="font-heading text-3xl md:text-4xl font-light text-primary-700"
          >
            {String(value).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em] text-[#a89e95] font-medium">
        {label}
      </span>
    </div>
  );
}

interface WeddingCountdownProps {
  eventDate?: string;
  eventTime?: string;
}

export default function WeddingCountdown({ eventDate, eventTime }: WeddingCountdownProps) {
  const dateStr = eventDate || DEFAULT_DATE;
  const timeStr = eventTime || DEFAULT_TIME;
  const weddingDate = new Date(`${dateStr}T${timeStr}:00-03:00`);

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(weddingDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(weddingDate)), 1000);
    return () => clearInterval(timer);
  }, [dateStr, timeStr]);

  const isOver = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isOver) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-3"
      >
        <p className="font-script text-4xl md:text-5xl text-primary-600">Hoje e o grande dia!</p>
        <p className="text-[#8a7e76] font-light">Que comece a celebracao!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="text-center space-y-6"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-[#a89e95] font-medium">
        Contagem regressiva
      </p>
      <div className="flex items-center justify-center gap-4 md:gap-6">
        <CountdownUnit value={timeLeft.days} label="Dias" />
        <span className="text-2xl text-primary-300 font-light mt-[-1.5rem]">:</span>
        <CountdownUnit value={timeLeft.hours} label="Horas" />
        <span className="text-2xl text-primary-300 font-light mt-[-1.5rem]">:</span>
        <CountdownUnit value={timeLeft.minutes} label="Minutos" />
        <span className="text-2xl text-primary-300 font-light mt-[-1.5rem]">:</span>
        <CountdownUnit value={timeLeft.seconds} label="Segundos" />
      </div>
    </motion.div>
  );
}
