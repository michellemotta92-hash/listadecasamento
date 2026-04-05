import { Outlet, Link, useParams, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'motion/react';
import { LayoutDashboard, Gift, CalendarClock, Settings, LogOut, ExternalLink, MessageSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', path: '', icon: LayoutDashboard },
  { label: 'Presentes', path: '/presentes', icon: Gift },
  { label: 'Reservas', path: '/reservas', icon: CalendarClock },
  { label: 'Recados', path: '/recados', icon: MessageSquare },
  { label: 'Confirmações', path: '/confirmacoes', icon: Users },
  { label: 'Configurações', path: '/config', icon: Settings },
];

export default function AdminLayout() {
  const { domain } = useParams();
  const { signOut } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    window.location.href = `/${domain}/admin/login`;
  };

  const basePath = `/${domain}/admin`;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-white font-serif tracking-[0.15em] uppercase text-lg">ParaSempre</span>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Painel de Controle
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const fullPath = basePath + item.path;
              const isActive = location.pathname === fullPath ||
                (item.path !== '' && location.pathname.startsWith(fullPath));

              return (
                <Link
                  key={item.path}
                  to={fullPath}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="adminActiveNav"
                      className="absolute inset-0 bg-white/10 rounded-lg"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to={`/${domain}`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver site ao vivo
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-500">
            Tenant: <span className="text-slate-800 font-semibold">{domain}</span>
          </h2>
        </header>
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
