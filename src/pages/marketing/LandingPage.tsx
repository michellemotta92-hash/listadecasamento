import { Link } from 'react-router';
import {
  ArrowRight, BarChart3, BriefcaseBusiness, CalendarCheck2, Check,
  ClipboardCheck, Gift, Heart, MessageSquare, ShieldCheck, Users2,
} from 'lucide-react';
import { appConfig } from '@/lib/config';

const features = [
  { icon: BriefcaseBusiness, title: 'Carteira multi-evento', desc: 'Acesse todos os casamentos da sua assessoria com uma única conta.' },
  { icon: ClipboardCheck, title: 'Planejamento', desc: 'Checklist com prazos, prioridades, andamento e itens compartilháveis com o casal.' },
  { icon: CalendarCheck2, title: 'RSVP centralizado', desc: 'Confirmações, acompanhantes e restrições em um painel pronto para operar.' },
  { icon: Gift, title: 'Presentes e Pix', desc: 'Lista, reservas seguras, links de loja e Pix informativo sem taxa escondida.' },
  { icon: MessageSquare, title: 'Experiência do convidado', desc: 'Site, recados moderados e informações do evento na mesma identidade visual.' },
  { icon: ShieldCheck, title: 'Acesso por organização', desc: 'Membros, papéis e dados isolados entre clientes desde o servidor.' },
];

const plans = [
  { name: 'Gratuito', price: 'R$ 0', desc: 'Validar o fluxo', items: ['1 evento ativo', '1 usuário', 'Site, RSVP e presentes'] },
  { name: 'Solo', price: 'R$ 89', desc: 'Assessoria independente', items: ['5 eventos ativos', 'Planejamento completo', 'Orçamento e exportações'] },
  { name: 'Pro', price: 'R$ 179', desc: 'Equipe em crescimento', featured: true, items: ['20 eventos ativos', '3 usuários', 'Check-in, mesas e automações'] },
  { name: 'Studio', price: 'R$ 329', desc: 'Operação em escala', items: ['60 eventos ativos', '10 usuários', 'Marca e domínio próprio'] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-400" />
            <span className="font-serif text-lg tracking-[0.16em] text-white">PARASEMPRE STUDIO</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/app/login" className="text-slate-300 hover:text-white">Entrar</Link>
            <Link to="/app/signup" className="rounded-full bg-rose-500 px-4 py-2 font-medium text-white hover:bg-rose-600">Criar workspace</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[520px] w-[800px] -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-32">
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">Sistema para assessorias e cerimonialistas</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white md:text-6xl">
                Planeje mais eventos e entregue uma experiência premium com a sua marca.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Organize a carteira de casamentos, tarefas, RSVP, presentes e o site dos noivos sem planilhas espalhadas ou um login diferente por cliente.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to="/app/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-7 py-3.5 font-medium text-white hover:bg-rose-600">
                  Começar gratuitamente <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to={`/${appConfig.defaultTenant}`} className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3.5 font-medium text-slate-200 hover:border-white/40 hover:text-white">
                  Ver experiência do convidado
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-500">Sem cartão · 1 evento gratuito · dados isolados por assessoria</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-rose-950/30">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div><p className="text-xs text-slate-500">Próximo evento</p><p className="font-semibold text-white">Marina & Rafael</p></div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">Em dia</span>
              </div>
              <div className="grid grid-cols-3 gap-3 py-5 text-center">
                {[['42', 'tarefas'], ['86%', 'RSVP'], ['18 dias', 'para o evento']].map(([value, label]) => (
                  <div key={label} className="rounded-xl bg-slate-950/70 p-3"><p className="text-lg font-semibold text-white">{value}</p><p className="text-[11px] text-slate-500">{label}</p></div>
                ))}
              </div>
              <div className="space-y-2">
                {['Confirmar mapa de mesas', 'Aprovar repertório da cerimônia', 'Revisar cronograma do Dia D'].map((task, index) => (
                  <div key={task} className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/40 p-3 text-sm text-slate-300">
                    <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-amber-400' : 'bg-rose-400'}`} />{task}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-900/40">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-5 px-4 py-10 text-center md:grid-cols-4">
            {[['1 conta', 'para todos os eventos'], ['0%', 'taxa sobre o Pix'], ['24/7', 'site dos noivos'], ['B2B2C', 'equipe, casal e convidados']].map(([value, label]) => (
              <div key={label}><p className="text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-24">
          <div className="mb-12 max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">Operação conectada</p><h2 className="mt-3 text-3xl font-semibold text-white">Do primeiro briefing ao último convidado</h2></div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                <Icon className="h-7 w-7 text-rose-400" /><h3 className="mt-4 font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-900/50 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">Planos de lançamento</p><h2 className="mt-3 text-3xl font-semibold text-white">Cresce com a sua carteira</h2></div>
              <p className="max-w-md text-sm leading-6 text-slate-400">Preço anual equivale a 10 mensalidades. O plano gratuito permite validar o produto antes de contratar.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <article key={plan.name} className={`relative rounded-2xl border p-5 ${plan.featured ? 'border-rose-400 bg-slate-900' : 'border-white/10 bg-slate-950/50'}`}>
                  {plan.featured && <span className="absolute -top-3 left-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold">Mais escolhido</span>}
                  <p className="font-semibold text-white">{plan.name}</p><p className="mt-1 text-xs text-slate-500">{plan.desc}</p>
                  <p className="mt-5 text-3xl font-semibold text-white">{plan.price}</p><p className="text-xs text-slate-500">por mês</p>
                  <ul className="my-6 space-y-2 text-sm text-slate-300">{plan.items.map((item) => <li key={item} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-400" />{item}</li>)}</ul>
                  <Link to="/app/signup" className="block rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm font-medium text-white hover:border-rose-400 hover:text-rose-300">Começar</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-24 text-center">
          <Users2 className="mx-auto h-10 w-10 text-rose-400" />
          <h2 className="mt-5 text-3xl font-semibold text-white">Oferta Fundadores: R$ 59/mês por 12 meses</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">Limitada às primeiras 20 assessorias, com até 5 eventos, onboarding individual e canal direto para construir o produto conosco.</p>
          <Link to="/app/signup" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-medium text-slate-950 hover:bg-slate-100">Quero ser cliente fundador <BarChart3 className="h-4 w-4" /></Link>
        </section>
      </main>

      <footer className="border-t border-white/10 py-10 text-center text-xs uppercase tracking-[0.18em] text-slate-600">ParaSempre Studio · tecnologia para quem transforma celebrações em experiências</footer>
    </div>
  );
}
