import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Users, Loader2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { getRSVPs, deleteRSVP } from '@/lib/services/rsvp';
import { RSVPEntry } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminRSVPPage() {
  const [rsvps, setRSVPs] = useState<RSVPEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getRSVPs();
    setRSVPs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    await deleteRSVP(id);
    load();
  };

  const confirmedCount = rsvps.filter(r => r.status === 'confirmado').length;
  const totalGuests = rsvps
    .filter(r => r.status === 'confirmado')
    .reduce((sum, r) => sum + r.guests_count, 0);

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
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sage-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-sage-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Confirmacoes de Presenca</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {confirmedCount} confirmado{confirmedCount !== 1 ? 's' : ''} · {totalGuests} pessoa{totalGuests !== 1 ? 's' : ''} no total
            </p>
          </div>
        </div>
      </motion.div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {rsvps.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            Nenhuma confirmacao recebida ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Convidado</th>
                  <th className="px-6 py-3.5">E-mail</th>
                  <th className="px-6 py-3.5">Pessoas</th>
                  <th className="px-6 py-3.5">Restricoes</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Data</th>
                  <th className="px-6 py-3.5 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {rsvps.map((rsvp) => (
                  <tr key={rsvp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{rsvp.guest_name}</p>
                        {rsvp.message && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{rsvp.message}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{rsvp.guest_email}</td>
                    <td className="px-6 py-4 text-center">{rsvp.guests_count}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{rsvp.dietary_restrictions || '-'}</td>
                    <td className="px-6 py-4">
                      {rsvp.status === 'confirmado' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-sage-50 text-sage-700 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Confirmado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3 h-3" /> Recusado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {format(new Date(rsvp.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(rsvp.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
