import type { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { CreditCard, Heart, LogOut, Plus } from 'lucide-react';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { cn } from '@/lib/utils';

const nav = [
  { label: 'Meus sites', path: '/app/sites' },
  { label: 'Novo site', path: '/app/sites/new' },
  { label: 'Planos', path: '/app/plans', icon: CreditCard },
];

export default function PlatformLayout() {
  const { user, signOut, isLoggedIn } = usePlatformAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/app/sites" className="flex items-center gap-2 font-serif tracking-widest text-white">
            <Heart className="w-5 h-5 text-rose-400" />
            ParaSempre
          </Link>
          {isLoggedIn && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400 hidden sm:inline">{user?.email}</span>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {isLoggedIn && (
        <div className="border-b border-slate-800 bg-slate-900/50">
          <div className="max-w-6xl mx-auto px-4 flex gap-6">
            {nav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? 'border-rose-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export function PlatformPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PlatformPrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}

export function NewSiteLink() {
  return (
    <Link
      to="/app/sites/new"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
    >
      <Plus className="w-4 h-4" />
      Criar site
    </Link>
  );
}
