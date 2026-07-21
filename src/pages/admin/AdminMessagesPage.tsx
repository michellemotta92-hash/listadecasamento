import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import AdminSearchInput from '@/components/admin/AdminSearchInput';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import MetricCard from '@/components/admin/MetricCard';
import StatusFilter from '@/components/admin/StatusFilter';
import { deleteMessage, getMessages, toggleMessageApproval } from '@/lib/services/messages';
import { GuestMessage } from '@/types';

type MessageFilter = 'todos' | 'aprovados' | 'ocultos';

const messageFilterOptions: { value: MessageFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os recados' },
  { value: 'aprovados', label: 'Aprovados' },
  { value: 'ocultos', label: 'Ocultos' },
];

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MessageFilter>('todos');
  const [deleteTarget, setDeleteTarget] = useState<GuestMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const data = await getMessages();
    setMessages(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredMessages = useMemo(() => {
    const query = normalizeText(search.trim());
    return messages.filter((msg) => {
      const matchesFilter = filter === 'todos' || (filter === 'aprovados' ? msg.is_approved : !msg.is_approved);
      const matchesSearch = !query || normalizeText(`${msg.guest_name} ${msg.message}`).includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, messages, search]);

  const approvedCount = messages.filter(message => message.is_approved).length;
  const hiddenCount = messages.length - approvedCount;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMessage(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (id: string) => {
    await toggleMessageApproval(id);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
          <MessageSquare className="h-5 w-5 text-primary-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mural de Recados</h1>
          <p className="mt-0.5 text-xs text-slate-400">{messages.length} mensagen{messages.length !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Total" value={messages.length} sub="recados recebidos" icon={MessageSquare} color="bg-primary-50 text-primary-600" />
        <MetricCard label="Aprovados" value={approvedCount} sub="visíveis no site" icon={Eye} color="bg-sage-50 text-sage-600" />
        <MetricCard label="Ocultos" value={hiddenCount} sub="fora do site público" icon={EyeOff} color="bg-gold-50 text-gold-600" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px]">
          <AdminSearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou mensagem..." />
          <StatusFilter<MessageFilter> value={filter} onChange={setFilter} options={messageFilterOptions} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filteredMessages.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">Nenhum recado encontrado.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-4 px-6 py-4 transition hover:bg-slate-50/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{msg.guest_name}</p>
                    {!msg.is_approved && (
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                        Oculto
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{msg.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleToggle(msg.id)}
                    className={`rounded-lg p-1.5 transition-colors ${
                      msg.is_approved ? 'text-slate-400 hover:bg-amber-50 hover:text-amber-500' : 'text-slate-400 hover:bg-sage-50 hover:text-sage-600'
                    }`}
                    title={msg.is_approved ? 'Ocultar' : 'Aprovar'}
                  >
                    {msg.is_approved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setDeleteTarget(msg)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir recado"
        message={`Tem certeza que deseja excluir o recado de "${deleteTarget?.guest_name || ''}"?`}
        confirmLabel="Excluir"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
