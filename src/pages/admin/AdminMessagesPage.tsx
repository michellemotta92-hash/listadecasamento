import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Loader2, Trash2, Eye, EyeOff } from 'lucide-react';
import { getMessages, deleteMessage, toggleMessageApproval } from '@/lib/services/messages';
import { GuestMessage } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getMessages();
    setMessages(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    await deleteMessage(id);
    load();
  };

  const handleToggle = async (id: string) => {
    await toggleMessageApproval(id);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mural de Recados</h1>
          <p className="text-slate-400 text-xs mt-0.5">{messages.length} mensagen{messages.length !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {messages.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            Nenhuma mensagem recebida ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 text-sm">{msg.guest_name}</p>
                    {!msg.is_approved && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 px-2 py-0.5 rounded">
                        Oculto
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{msg.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(msg.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      msg.is_approved
                        ? 'hover:bg-amber-50 text-slate-400 hover:text-amber-500'
                        : 'hover:bg-sage-50 text-slate-400 hover:text-sage-600'
                    }`}
                    title={msg.is_approved ? 'Ocultar' : 'Aprovar'}
                  >
                    {msg.is_approved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
