import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Heart } from 'lucide-react';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';

export default function PlatformLoginPage() {
  const { signIn, isLoggedIn, loading } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/app/sites';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isLoggedIn) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Erro ao entrar');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 text-white mb-8">
          <Heart className="w-6 h-6 text-rose-400" />
          <span className="font-serif tracking-widest">ParaSempre</span>
        </Link>
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4"
        >
          <h1 className="text-xl font-semibold text-white text-center">Entrar na plataforma</h1>
          <p className="text-slate-400 text-sm text-center">Gerencie seus sites de casamento</p>
          {error && (
            <p className="text-sm text-rose-400 bg-rose-950/50 border border-rose-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm disabled:opacity-50"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
          <p className="text-center text-sm text-slate-400">
            Não tem conta?{' '}
            <Link to="/app/signup" className="text-rose-400 hover:text-rose-300">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
