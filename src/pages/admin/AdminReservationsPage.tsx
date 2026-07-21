import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { CalendarClock, Clock, Gift, Loader2, Mail, User } from 'lucide-react';
import AdminSearchInput from '@/components/admin/AdminSearchInput';
import MetricCard from '@/components/admin/MetricCard';
import StatusFilter from '@/components/admin/StatusFilter';
import { getReservations } from '@/lib/services/reservations';
import { GiftReservation, ReservationStatus } from '@/types';

type ReservationStatusFilter = 'todos' | ReservationStatus;

const statusOptions: { value: ReservationStatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'expirada', label: 'Expiradas' },
  { value: 'cancelada', label: 'Canceladas' },
];

const statusLabel: Record<string, string> = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  expirada: 'Expirada',
};

const statusColor: Record<string, string> = {
  pendente: 'bg-gold-50 text-gold-700',
  confirmada: 'bg-sage-50 text-sage-700',
  cancelada: 'bg-red-50 text-red-700',
  expirada: 'bg-slate-100 text-slate-500',
};

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<GiftReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatusFilter>('todos');

  useEffect(() => {
    getReservations().then((data) => {
      setReservations(data);
      setLoading(false);
    });
  }, []);

  const filteredReservations = useMemo(() => {
    const query = normalizeText(search.trim());
    return reservations.filter((reservation) => {
      const matchesStatus = statusFilter === 'todos' || reservation.status === statusFilter;
      const searchable = `${reservation.guest_name || ''} ${reservation.guest_email || ''} ${reservation.gift_name || ''}`;
      const matchesSearch = !query || normalizeText(searchable).includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [reservations, search, statusFilter]);

  const pendingCount = reservations.filter(res => res.status === 'pendente').length;
  const confirmedCount = reservations.filter(res => res.status === 'confirmada').length;
  const expiredCount = reservations.filter(res => res.status === 'expirada').length;

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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50">
          <CalendarClock className="h-5 w-5 text-gold-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reservas</h1>
          <p className="mt-0.5 text-xs text-slate-400">{reservations.length} reservas registradas</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Pendentes" value={pendingCount} sub="aguardando confirmação" icon={Clock} color="bg-gold-50 text-gold-600" />
        <MetricCard label="Confirmadas" value={confirmedCount} sub="presentes comprados" icon={Gift} color="bg-sage-50 text-sage-600" />
        <MetricCard label="Expiradas" value={expiredCount} sub="voltaram para disponíveis" icon={CalendarClock} color="bg-slate-100 text-slate-600" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px]">
          <AdminSearchInput value={search} onChange={setSearch} placeholder="Buscar por convidado, e-mail ou presente..." />
          <StatusFilter<ReservationStatusFilter> value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filteredReservations.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm">Nenhuma reserva encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Convidado</th>
                  <th className="px-6 py-3.5">Presente</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Expira em</th>
                  <th className="px-6 py-3.5">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReservations.map((res) => (
                  <tr key={res.id} className={`transition hover:bg-slate-50/50 ${res.status === 'pendente' ? 'bg-gold-50/20' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-800">{res.guest_name || 'Anônimo'}</span>
                      </div>
                      {res.guest_email && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <Mail className="h-3 w-3" />
                          {res.guest_email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{res.gift_name || 'Presente não encontrado'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColor[res.status] || 'bg-slate-100 text-slate-500'}`}>
                        {statusLabel[res.status] || res.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(res.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {format(new Date(res.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
