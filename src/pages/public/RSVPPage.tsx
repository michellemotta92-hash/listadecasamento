import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Send, Loader2, CheckCircle2, Users, UtensilsCrossed, MessageCircle } from 'lucide-react';
import { addRSVP } from '@/lib/services/rsvp';
import { getSiteConfig } from '@/lib/services/site-config';
import { PageTexts } from '@/types';

export default function RSVPPage() {
  const [texts, setTexts] = useState<PageTexts>({});
  const [form, setForm] = useState({
    guest_name: '',
    guest_email: '',
    guests_count: 1,
    dietary_restrictions: '',
    message: '',
    status: 'confirmado' as 'confirmado' | 'recusado',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getSiteConfig().then(c => setTexts(c.page_texts || {}));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guest_name.trim() || !form.guest_email.trim()) return;

    setSending(true);
    try {
      await addRSVP({
        guest_name: form.guest_name.trim(),
        guest_email: form.guest_email.trim(),
        guests_count: form.guests_count,
        dietary_restrictions: form.dietary_restrictions.trim() || null,
        message: form.message.trim() || null,
        status: form.status,
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[#a89e95] font-medium">{texts.rsvp_subtitle || 'RSVP'}</p>
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-[#4a3f38] tracking-wide">
          {texts.rsvp_title || 'Confirme sua Presenca'}
        </h2>
        <div className="divider-ornament" />
        <p className="text-[#8a7e76] max-w-xl mx-auto leading-relaxed font-light text-lg">
          {texts.rsvp_description || 'Ficaremos muito felizes com a sua presenca. Por favor, confirme ate o dia 01/09/2026.'}
        </p>
      </motion.div>

      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 max-w-md mx-auto rounded-2xl shadow-soft text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-sage-50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-sage-600" />
          </div>
          <h3 className="font-heading text-2xl font-medium text-[#4a3f38]">Obrigado!</h3>
          <p className="text-[#8a7e76] font-light">
            {form.status === 'confirmado'
              ? 'Sua presenca foi confirmada. Estamos ansiosos para celebrar com voce!'
              : 'Sentiremos sua falta! Esperamos ve-lo em outra ocasiao.'}
          </p>
          <Heart className="w-5 h-5 text-primary-400 mx-auto" />
        </motion.div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="glass-card p-8 md:p-10 max-w-lg mx-auto rounded-2xl shadow-soft space-y-6"
        >
          {/* Status toggle */}
          <div className="flex rounded-full border border-[#e0d0c8] overflow-hidden">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, status: 'confirmado' }))}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                form.status === 'confirmado'
                  ? 'bg-sage-50 text-sage-700'
                  : 'text-[#8a7e76] hover:bg-[#f5f0e8]'
              }`}
            >
              Vou estar presente
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, status: 'recusado' }))}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                form.status === 'recusado'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-[#8a7e76] hover:bg-[#f5f0e8]'
              }`}
            >
              Nao poderei ir
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8a7e76] mb-1.5">Nome completo *</label>
              <input
                type="text"
                value={form.guest_name}
                onChange={(e) => setForm(f => ({ ...f, guest_name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#e0d0c8] bg-white/80 text-sm text-[#4a3f38] placeholder:text-[#b5aea5] focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                placeholder="Seu nome"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8a7e76] mb-1.5">E-mail *</label>
              <input
                type="email"
                value={form.guest_email}
                onChange={(e) => setForm(f => ({ ...f, guest_email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#e0d0c8] bg-white/80 text-sm text-[#4a3f38] placeholder:text-[#b5aea5] focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>

            {form.status === 'confirmado' && (
              <>
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-[#8a7e76] mb-1.5">
                    <Users className="w-3.5 h-3.5" /> Numero de pessoas (incluindo voce)
                  </label>
                  <select
                    value={form.guests_count}
                    onChange={(e) => setForm(f => ({ ...f, guests_count: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#e0d0c8] bg-white/80 text-sm text-[#4a3f38] focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'pessoa' : 'pessoas'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-[#8a7e76] mb-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5" /> Restricoes alimentares
                  </label>
                  <input
                    type="text"
                    value={form.dietary_restrictions}
                    onChange={(e) => setForm(f => ({ ...f, dietary_restrictions: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#e0d0c8] bg-white/80 text-sm text-[#4a3f38] placeholder:text-[#b5aea5] focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
                    placeholder="Vegetariano, sem gluten, etc."
                  />
                </div>
              </>
            )}

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#8a7e76] mb-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> Mensagem para os noivos
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#e0d0c8] bg-white/80 text-sm text-[#4a3f38] placeholder:text-[#b5aea5] focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all resize-none"
                placeholder="Deixe uma mensagem (opcional)"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={sending}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-sm shadow-soft hover:shadow-elegant transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                {form.status === 'confirmado' ? 'Confirmar presenca' : 'Enviar resposta'}
              </>
            )}
          </motion.button>
        </motion.form>
      )}
    </div>
  );
}
