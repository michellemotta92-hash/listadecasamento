import { useState, useEffect } from 'react';
import { getReservations } from '@/lib/services/reservations';
import { GiftReservation } from '@/types';
import { motion } from 'motion/react';
import { CalendarClock, Loader2, User, Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<GiftReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReservations().then((data) => {
      setReservations(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center">
          <CalendarClock className="w-5 h-5 text-gold-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reservas</h1>
          <p className="text-slate-400 text-xs mt-0.5">{reservations.length} reservas registradas</p>
        </div>
      </motion.div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {reservations.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <CalendarClock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Nenhuma reserva registrada ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Convidado</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Expira em</th>
                  <th className="px-6 py-3.5">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-800">{res.guest_name || 'Anônimo'}</span>
                      </div>
                      {res.guest_email && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <Mail className="w-3 h-3" />
                          {res.guest_email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor[res.status] || 'bg-slate-100 text-slate-500'}`}>
                        {statusLabel[res.status] || res.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(res.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {format(new Date(res.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
