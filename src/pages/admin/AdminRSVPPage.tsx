import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2, Trash2, Users, XCircle } from 'lucide-react';
import AdminSearchInput from '@/components/admin/AdminSearchInput';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import MetricCard from '@/components/admin/MetricCard';
import StatusFilter from '@/components/admin/StatusFilter';
import { deleteRSVP, getRSVPs } from '@/lib/services/rsvp';
import { RSVPEntry } from '@/types';

type RSVPFilter = 'todos' | 'confirmado' | 'recusado';

const rsvpFilterOptions: { value: RSVPFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'recusado', label: 'Recusados' },
];

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function AdminRSVPPage() {
  const [rsvps, setRSVPs] = useState<RSVPEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RSVPFilter>('todos');
  const [deleteTarget, setDeleteTarget] = useState<RSVPEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const data = await getRSVPs();
    setRSVPs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredRSVPs = useMemo(() => {
    const query = normalizeText(search.trim());
    return rsvps.filter((rsvp) => {
      const matchesFilter = filter === 'todos' || rsvp.status === filter;
      const searchable = `${rsvp.guest_name} ${rsvp.guest_email} ${rsvp.dietary_restrictions || ''} ${rsvp.message || ''}`;
      const matchesSearch = !query || normalizeText(searchable).includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, rsvps, search]);

  const confirmedCount = rsvps.filter(r => r.status === 'confirmado').length;
  const declinedCount = rsvps.filter(r => r.status === 'recusado').length;
  const totalGuests = rsvps.filter(r => r.status === 'confirmado').reduce((sum, r) => sum + r.guests_count, 0);
  const filteredGuests = filteredRSVPs.filter(r => r.status === 'confirmado').reduce((sum, r) => sum + r.guests_count, 0);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRSVP(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
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
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-50">
            <Users className="h-5 w-5 text-sage-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Confirmações de Presença</h1>
            <p className="mt-0.5 text-xs text-slate-400">
              {confirmedCount} confirmado{confirmedCount !== 1 ? 's' : ''} · {totalGuests} pessoa{totalGuests !== 1 ? 's' : ''} no total
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Confirmados" value={confirmedCount} sub="respostas sim" icon={CheckCircle2} color="bg-sage-50 text-sage-600" />
        <MetricCard label="Pessoas" value={totalGuests} sub="convidados confirmados" icon={Users} color="bg-primary-50 text-primary-600" />
        <MetricCard label="Recusados" value={declinedCount} sub="não poderão ir" icon={XCircle} color="bg-red-50 text-red-600" />
        <MetricCard label="Pessoas no Filtro" value={filteredGuests} sub={`${filteredRSVPs.length} respostas exibidas`} icon={Users} color="bg-slate-100 text-slate-600" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px]">
          <AdminSearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, e-mail, restrição ou mensagem..." />
          <StatusFilter<RSVPFilter> value={filter} onChange={setFilter} options={rsvpFilterOptions} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {filteredRSVPs.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">Nenhuma confirmação encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Convidado</th>
                  <th className="px-6 py-3.5">E-mail</th>
                  <th className="px-6 py-3.5">Pessoas</th>
                  <th className="px-6 py-3.5">Restrições</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Data</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {filteredRSVPs.map((rsvp) => (
                  <tr key={rsvp.id} className="transition hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{rsvp.guest_name}</p>
                      {rsvp.message && <p className="mt-0.5 max-w-[240px] truncate text-[11px] text-slate-400">{rsvp.message}</p>}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{rsvp.guest_email}</td>
                    <td className="px-6 py-4 text-center">{rsvp.guests_count}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{rsvp.dietary_restrictions || '-'}</td>
                    <td className="px-6 py-4">
                      {rsvp.status === 'confirmado' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sage-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sage-700">
                          <CheckCircle2 className="h-3 w-3" /> Confirmado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
                          <XCircle className="h-3 w-3" /> Recusado
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-400">
                      {format(new Date(rsvp.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setDeleteTarget(rsvp)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir confirmação"
        message={`Tem certeza que deseja excluir a confirma??o de "${deleteTarget?.guest_name || ''}"?`}
        confirmLabel="Excluir"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
