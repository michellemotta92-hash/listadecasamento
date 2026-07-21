import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Heart } from 'lucide-react';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';

export default function PlatformSignupPage() {
  const { signUp, isLoggedIn, loading } = usePlatformAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isLoggedIn) {
    return <Navigate to="/app/sites" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await signUp(email, password, name);
    setSubmitting(false);
    if (result.success) {
      navigate('/app/sites/new', { replace: true });
    } else {
      setError(result.error || 'Erro ao cadastrar');
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
          <h1 className="text-xl font-semibold text-white text-center">Criar conta</h1>
          {error && (
            <p className="text-sm text-rose-400 bg-rose-950/50 border border-rose-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Seu nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
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
            <label className="block text-xs text-slate-400 mb-1">Senha (mín. 8)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm disabled:opacity-50"
          >
            {submitting ? 'Criando...' : 'Continuar'}
          </button>
          <p className="text-center text-sm text-slate-400">
            Já tem conta?{' '}
            <Link to="/app/login" className="text-rose-400 hover:text-rose-300">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
