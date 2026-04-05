import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'motion/react';
import { Lock, User, LogIn, Loader2 } from 'lucide-react';
import { appConfig } from '@/lib/config';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { domain } = useParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(username, password);

    if (result.success) {
      navigate(`/${domain}/admin`);
    } else {
      setError(result.error || 'Erro ao fazer login.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center mb-8">
          <h2 className="font-script text-4xl text-primary-700">ParaSempre</h2>
          <p className="mt-2 text-sm text-[#8a7e76] tracking-wider uppercase">Painel de Controle</p>
        </div>

        <div className="glass-card py-8 px-6 sm:px-10 shadow-elegant">
          {appConfig.isDemoMode && (
            <div className="mb-6 bg-blush/30 border border-blush p-4 rounded-lg text-sm text-primary-800 text-center">
              <strong>Modo Demo</strong>
              <br />
              Login: <code className="bg-blush/50 px-1.5 py-0.5 rounded text-xs font-mono">admin</code>
              <br />
              Senha: <code className="bg-blush/50 px-1.5 py-0.5 rounded text-xs font-mono">admin123</code>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-[#5a4f46] mb-1.5">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5aea5]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-[#e0d0c8] rounded-lg bg-white/80 shadow-sm placeholder-[#c4bbb2] focus:outline-none focus:ring-2 focus:ring-primary-300/50 focus:border-primary-400 text-sm transition-all duration-200"
                  placeholder="Digite seu usuário"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5a4f46] mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5aea5]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-[#e0d0c8] rounded-lg bg-white/80 shadow-sm placeholder-[#c4bbb2] focus:outline-none focus:ring-2 focus:ring-primary-300/50 focus:border-primary-400 text-sm transition-all duration-200"
                  placeholder="Digite sua senha"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 p-3 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-8 rounded-full text-sm font-medium tracking-wider uppercase text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 shadow-soft hover:shadow-elegant disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Entrar
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
