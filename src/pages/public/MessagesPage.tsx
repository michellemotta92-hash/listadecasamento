import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { getApprovedMessages } from '@/lib/services/messages';
import { GuestMessage } from '@/types';
import MessageCard from '@/components/public/MessageCard';
import MessageForm from '@/components/public/MessageForm';

export default function MessagesPage() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    const data = await getApprovedMessages();
    setMessages(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[#a89e95] font-medium">Mural</p>
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-[#4a3f38] tracking-wide">
          Recados & Votos
        </h2>
        <div className="divider-ornament" />
        <p className="text-[#8a7e76] max-w-xl mx-auto leading-relaxed font-light text-lg">
          Deixe uma mensagem carinhosa para os noivos. Cada palavra sera guardada com muito amor.
        </p>
      </motion.div>

      <MessageForm onMessageSent={loadMessages} />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <MessageSquare className="w-8 h-8 text-[#d4cfc8] mx-auto" />
          <p className="text-[#a89e95]">Seja o primeiro a deixar uma mensagem!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messages.map((msg, i) => (
            <MessageCard key={msg.id} message={msg} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
