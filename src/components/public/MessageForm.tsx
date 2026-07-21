import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { addMessage } from '@/lib/services/messages';

const MAX_MESSAGE_CHARS = 1000;

interface Props {
  onMessageSent: () => void;
}

export default function MessageForm({ onMessageSent }: Props) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const charCount = message.length;
  const isValid = name.trim().length >= 2 && message.trim().length >= 3 && charCount <= MAX_MESSAGE_CHARS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValid) return;

    setSending(true);
    try {
      await addMessage({ guest_name: name.trim(), message: message.trim() });
      setSent(true);
      setName('');
      setMessage('');
      onMessageSent();
      setTimeout(() => setSent(false), 3000);
    } catch {
      setError('Erro ao enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      onSubmit={handleSubmit}
      className="glass-card p-6 md:p-8 rounded-2xl shadow-soft space-y-4 max-w-lg mx-auto"
    >
      <h3 className="font-heading text-xl font-medium text-[#4a3f38] text-center">
        Deixe sua mensagem
      </h3>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-[#e0d0c8] bg-white/80 text-sm text-[#4a3f38] placeholder:text-[#b5aea5] focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
          required
        />
        <div className="relative">
          <textarea
            placeholder="Escreva uma mensagem carinhosa para o casal..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MAX_MESSAGE_CHARS}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border bg-white/80 text-sm text-[#4a3f38] placeholder:text-[#b5aea5] focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all resize-none"
            required
          />
          <span className={`absolute bottom-2 right-3 text-[10px] ${
            charCount > MAX_MESSAGE_CHARS ? 'text-red-500 font-bold' : 'text-[#a89e95]'
          }`}>
            {charCount}/{MAX_MESSAGE_CHARS}
          </span>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-xs">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}
      </div>

      <p className="text-[10px] text-[#a89e95] text-center">
        Sua mensagem será?? após aprovação do casal.
      </p>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={sending || !isValid}
        className="w-full py-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-sm shadow-soft hover:shadow-elegant transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : sent ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Mensagem enviada!
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar mensagem
          </>
        )}
      </motion.button>
    </motion.form>
  );
}