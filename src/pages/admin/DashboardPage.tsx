import { useGifts } from '@/hooks/useGifts';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'motion/react';
import { ShoppingBag, DollarSign, Clock, TrendingUp, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { gifts, loading } = useGifts();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  const totalGifts = gifts.length;
  const boughtGifts = gifts.filter(g => g.status === 'comprado');
  const reservedGifts = gifts.filter(g => g.status === 'reservado');
  const totalValue = boughtGifts.reduce((sum, g) => sum + g.price, 0);
  const progressPercent = totalGifts > 0 ? Math.round((boughtGifts.length / totalGifts) * 100) : 0;

  const stats = [
    {
      label: 'Presentes Comprados',
      value: `${boughtGifts.length}`,
      sub: `de ${totalGifts}`,
      icon: ShoppingBag,
      color: 'text-sage-600 bg-sage-50',
      progress: progressPercent,
    },
    {
      label: 'Valor Arrecadado',
      value: formatCurrency(totalValue),
      sub: 'baseado em itens comprados',
      icon: DollarSign,
      color: 'text-primary-600 bg-primary-50',
    },
    {
      label: 'Reservas Pendentes',
      value: `${reservedGifts.length}`,
      sub: 'aguardando confirmação',
      icon: Clock,
      color: 'text-gold-600 bg-gold-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
        <p className="text-slate-500 text-sm mt-1">Acompanhe o status do seu site e lista de presentes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
              {stat.sub && <span className="text-xs text-slate-400">{stat.sub}</span>}
            </div>
            {stat.progress !== undefined && (
              <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full bg-sage-500 rounded-full"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent purchases */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Últimos Presentes Comprados</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {boughtGifts.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">
              Nenhum presente comprado ainda.
            </div>
          ) : (
            boughtGifts.slice(0, 5).map((gift) => (
              <div key={gift.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <img src={gift.image_url || ''} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{gift.name}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(gift.price)}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-sage-50 text-sage-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Comprado
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
