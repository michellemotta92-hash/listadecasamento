import { useEffect, useMemo, useState } from 'react';
import { Check, Crown, Loader2 } from 'lucide-react';
import { platformApi } from '@/features/platform/api';
import { PlanId, PlanSummary, PlatformAccount } from '@/types/platform';
import { PlatformPageHeader } from '@/components/layout/PlatformLayout';

const featureLabels: Array<[string, string]> = [
  ['budget.enabled', 'Orçamento e fornecedores'],
  ['day_of.enabled', 'Cronograma do Dia D'],
  ['seating.enabled', 'Mesas e assentos'],
  ['checkin.enabled', 'Check-in de convidados'],
  ['branding.remove_powered_by', 'Remover marca ParaSempre'],
  ['custom_domain.enabled', 'Domínio próprio'],
  ['exports.enabled', 'Exportações CSV/PDF'],
];

function money(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(cents / 100);
}

function limit(entitlements: PlanSummary['entitlements'], key: string) {
  const value = entitlements[key];
  return typeof value === 'number' ? value : 0;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [account, setAccount] = useState<PlatformAccount | null>(null);
  const [annual, setAnnual] = useState(false);
  const [requesting, setRequesting] = useState<PlanId | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([platformApi.listPlans(), platformApi.account()])
      .then(([availablePlans, currentAccount]) => {
        setPlans(availablePlans);
        setAccount(currentAccount);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Erro ao carregar planos'));
  }, []);

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.code === account?.plan.code),
    [account?.plan.code, plans]
  );

  const requestPlan = async (planCode: PlanId) => {
    setRequesting(planCode);
    setError('');
    setMessage('');
    try {
      const result = await platformApi.requestUpgrade({
        plan_code: planCode,
        billing_cycle: annual ? 'annual' : 'monthly',
      });
      setMessage(
        result.already_pending
          ? 'Sua solicitação já está na fila. Entraremos em contato.'
          : 'Solicitação registrada. Nossa equipe entrará em contato para ativar o plano.'
      );
      const refreshed = await platformApi.account();
      setAccount(refreshed);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível solicitar o plano');
    } finally {
      setRequesting(null);
    }
  };

  return (
    <>
      <PlatformPageHeader
        title="Planos e uso"
        description="Limites aplicados no servidor, sem apagar seus dados ao mudar de plano."
      />

      {account && currentPlan && (
        <section className="mb-8 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">Plano atual</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">{currentPlan.name}</h2>
              <p className="mt-1 text-sm text-slate-400">Workspace: {account.organization.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Usage
                label="Eventos ativos"
                value={account.usage.active_events}
                maximum={limit(account.entitlements, 'active_events.max')}
              />
              <Usage
                label="Equipe"
                value={account.usage.team_seats}
                maximum={limit(account.entitlements, 'team_seats.max')}
              />
            </div>
          </div>
          {account.pending_request && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Solicitação do plano {account.pending_request.requested_plan_code} em análise.
            </p>
          )}
        </section>
      )}

      <div className="mb-6 flex items-center justify-center gap-3 text-sm">
        <span className={!annual ? 'text-white' : 'text-slate-500'}>Mensal</span>
        <button
          type="button"
          aria-label="Alternar ciclo de cobrança"
          onClick={() => setAnnual((value) => !value)}
          className={`relative h-7 w-12 rounded-full transition-colors ${annual ? 'bg-rose-500' : 'bg-slate-700'}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${annual ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className={annual ? 'text-white' : 'text-slate-500'}>Anual · 2 meses grátis</span>
      </div>

      {error && <p className="mb-5 rounded-lg border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">{error}</p>}
      {message && <p className="mb-5 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">{message}</p>}

      {plans.length === 0 && !error ? (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-rose-400" /></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.code === account?.plan.code;
            const price = annual ? plan.annual_price_cents / 10 : plan.monthly_price_cents;
            return (
              <article
                key={plan.code}
                className={`relative rounded-2xl border p-5 ${plan.code === 'pro' ? 'border-rose-400 bg-slate-900' : 'border-slate-800 bg-slate-900/70'}`}
              >
                {plan.code === 'pro' && (
                  <span className="absolute -top-3 left-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">Mais escolhido</span>
                )}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                  {plan.code === 'studio' && <Crown className="h-5 w-5 text-amber-300" />}
                </div>
                <p className="mt-2 min-h-10 text-sm text-slate-400">{plan.description}</p>
                <p className="mt-5 text-3xl font-semibold text-white">{money(price)}</p>
                <p className="text-xs text-slate-500">por mês{annual ? ', cobrado anualmente' : ''}</p>
                <ul className="my-6 space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-400" />Até {limit(plan.entitlements, 'active_events.max')} eventos ativos</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-400" />{limit(plan.entitlements, 'team_seats.max')} usuário(s) na equipe</li>
                  {featureLabels.filter(([key]) => plan.entitlements[key] === true).map(([key, label]) => (
                    <li key={key} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-400" />{label}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent || plan.code === 'free' || requesting !== null}
                  onClick={() => requestPlan(plan.code)}
                  className="w-full rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                >
                  {requesting === plan.code ? 'Enviando...' : isCurrent ? 'Plano atual' : plan.code === 'free' ? 'Plano de entrada' : 'Solicitar contratação'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function Usage({ label, value, maximum }: { label: string; value: number; maximum: number }) {
  const percentage = maximum > 0 ? Math.min(100, Math.round((value / maximum) * 100)) : 100;
  return (
    <div className="min-w-36 rounded-xl bg-slate-950/60 p-3">
      <div className="flex justify-between text-xs text-slate-400"><span>{label}</span><span>{value}/{maximum}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-rose-400" style={{ width: `${percentage}%` }} /></div>
    </div>
  );
}
