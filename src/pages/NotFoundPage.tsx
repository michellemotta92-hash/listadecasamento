import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Home } from 'lucide-react';
import { appConfig } from '@/lib/config';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFA] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <h1 className="text-7xl font-serif text-primary-300 mb-4">404</h1>
        <h2 className="text-2xl font-serif text-slate-800 mb-2">Página não encontrada</h2>
        <p className="text-slate-500 mb-8">A página que você está procurando não existe ou foi movida.</p>
        <Link
          to={`/${appConfig.defaultTenant}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all shadow-sm"
        >
          <Home className="w-4 h-4" />
          Voltar ao início
        </Link>
      </motion.div>
    </div>
  );
}
