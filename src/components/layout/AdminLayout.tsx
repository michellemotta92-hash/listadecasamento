import { Link, Outlet, useLocation, useParams } from 'react-router';
import { motion } from 'motion/react';
import { CalendarClock, CheckSquare2, ExternalLink, Gift, LayoutDashboard, LogOut, MessageSquare, Settings, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { cn } from '@/lib/utils';
import { PublicPage } from '@/types';

const navItems: { label: string; path: string; icon: any; publicPage?: PublicPage }[] = [
  { label: 'Dashboard', path: '', icon: LayoutDashboard },
  { label: 'Planejamento', path: '/planejamento', icon: CheckSquare2 },
  { label: 'Presentes', path: '/presentes', icon: Gift, publicPage: 'presentes' },
  { label: 'Reservas', path: '/reservas', icon: CalendarClock },
  { label: 'Recados', path: '/recados', icon: MessageSquare, publicPage: 'recados' },
  { label: 'Confirmações', path: '/confirmacoes', icon: Users, publicPage: 'confirmar' },
  { label: 'Configurações', path: '/config', icon: Settings },
];

export default function AdminLayout() {
  const { domain } = useParams();
  const { signOut } = useAuth();
  const location = useLocation();
  const { data: config } = useSiteConfig();
  const hiddenPages = config?.hidden_pages || [];

  const handleLogout = async () => {
    await signOut();
    window.location.href = `/${domain}/admin/login`;
  };

  const basePath = `/${domain}/admin`;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-slate-900 text-slate-300">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <span className="font-serif text-lg uppercase tracking-[0.15em] text-white">ParaSempre</span>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Painel de Controle
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const fullPath = basePath + item.path;
              const isActive = location.pathname === fullPath || (item.path !== '' && location.pathname.startsWith(fullPath));
              const isDraft = item.publicPage && hiddenPages.includes(item.publicPage);

              return (
                <Link
                  key={item.path}
                  to={fullPath}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="adminActiveNav"
                      className="absolute inset-0 rounded-lg bg-white/10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10 flex-1">{item.label}</span>
                  {isDraft && (
                    <span className="relative z-10 rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                      Rascunho
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-slate-800 p-4">
          <Link to={`/${domain}`} target="_blank" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 transition hover:text-white">
            <ExternalLink className="h-4 w-4" />
            Ver site ao vivo
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-400 transition hover:text-white">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="ml-64 min-h-screen flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-slate-200 bg-white px-8">
          <h2 className="text-sm font-medium text-slate-500">
            Tenant: <span className="font-semibold text-slate-800">{domain}</span>
          </h2>
        </header>
        <div className="p-8">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
