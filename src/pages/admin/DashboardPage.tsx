import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { motion } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Loader2,
  Package,
  TrendingUp,
  WalletCards,
  AlertCircle,
} from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import { useGifts } from '@/hooks/useGifts';
import { formatCurrency, parseCurrencyValue } from '@/lib/utils';

export default function DashboardPage() {
  const { data: gifts = [], isLoading, error, refetch } = useGifts();
  const { domain } = useParams();
  const [showAllBought, setShowAllBought] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-slate-500">Erro ao carregar dados.</p>
        <button
          onClick={() => refetch()}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const totalGifts = gifts.length;
  const boughtGifts = gifts.filter(g => g.status === 'comprado');
  const reservedGifts = gifts.filter(g => g.status === 'reservado');
  const availableGifts = gifts.filter(g => g.status === 'disponivel');
  const listValue = gifts.reduce((sum, g) => sum + parseCurrencyValue(g.price), 0);
  const boughtValue = boughtGifts.reduce((sum, g) => sum + parseCurrencyValue(g.price), 0);
  const reservedValue = reservedGifts.reduce((sum, g) => sum + parseCurrencyValue(g.price), 0);
  const pendingValue = availableGifts.reduce((sum, g) => sum + parseCurrencyValue(g.price), 0);
  const progressPercent = totalGifts > 0 ? Math.round((boughtGifts.length / totalGifts) * 100) : 0;
  const visibleBoughtGifts = showAllBought ? boughtGifts : boughtGifts.slice(0, 5);
  const giftsPath = `/${domain}/admin/presentes`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
        <p className="mt-1 text-sm text-slate-500">Acompanhe o status do seu site e lista de presentes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Valor Arrecadado"
          value={formatCurrency(boughtValue)}
          sub={`${boughtGifts.length} comprados`}
          icon={DollarSign}
          color="bg-sage-50 text-sage-600"
          progress={progressPercent}
        />
        <MetricCard
          label="Valor Reservado"
          value={formatCurrency(reservedValue)}
          sub={`${reservedGifts.length} aguardando confirmação`}
          icon={Clock}
          color="bg-gold-50 text-gold-600"
        />
        <MetricCard
          label="Valor Pendente"
          value={formatCurrency(pendingValue)}
          sub={`${availableGifts.length} disponíveis`}
          icon={WalletCards}
          color="bg-primary-50 text-primary-600"
        />
        <MetricCard
          label="Valor Total da Lista"
          value={formatCurrency(listValue)}
          sub={`${totalGifts} presentes cadastrados`}
          icon={Package}
          color="bg-slate-100 text-slate-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link to={`${giftsPath}?status=comprado`} className="rounded-xl border border-sage-100 bg-sage-50 px-4 py-3 text-sm font-medium text-sage-700 transition hover:bg-sage-100">
          Ver comprados
        </Link>
        <Link to={`${giftsPath}?status=reservado`} className="rounded-xl border border-gold-100 bg-gold-50 px-4 py-3 text-sm font-medium text-gold-700 transition hover:bg-gold-100">
          Ver reservados
        </Link>
        <Link to={`${giftsPath}?status=disponivel`} className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700 transition hover:bg-primary-100">
          Ver disponíveis
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Presentes Comprados</h3>
          </div>
          {boughtGifts.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllBought(current => !current)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 transition hover:text-primary-700"
            >
              {showAllBought ? (
                <>
                  Ver menos
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Ver todos ({boughtGifts.length})
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-50">
          {boughtGifts.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              Nenhum presente comprado ainda.
            </div>
          ) : (
            visibleBoughtGifts.map((gift) => (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <img src={gift.image_url || ''} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{gift.name}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(gift.price)}</p>
                  </div>
                </div>
                <span className="rounded-full bg-sage-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sage-700">
                  Comprado
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
