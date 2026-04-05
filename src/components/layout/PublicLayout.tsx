import { Outlet, Link, useParams } from 'react-router';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

export default function PublicLayout() {
  const { domain } = useParams();

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#3d3530] font-sans">
      {/* Header - vows-unfolded style: glass, fixed, elegant */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/80 backdrop-blur-md border-b border-[#e0d0c8]/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-center h-16 md:h-20">
          <div className="text-center">
            <Link to={`/${domain}`} className="group">
              <h1 className="font-script text-3xl md:text-4xl text-primary-700 transition-colors group-hover:text-primary-500">
                Mi & John
              </h1>
            </Link>
            <nav className="mt-1 flex items-center justify-center gap-8 text-xs uppercase tracking-[0.15em] text-[#8a7e76] font-medium">
              <Link to={`/${domain}`} className="hover:text-primary-600 transition-colors duration-200">
                Home
              </Link>
              <span className="w-1 h-1 rounded-full bg-primary-300" />
              <Link to={`/${domain}/presentes`} className="hover:text-primary-600 transition-colors duration-200">
                Lista de Presentes
              </Link>
              <span className="w-1 h-1 rounded-full bg-primary-300" />
              <Link to={`/${domain}/recados`} className="hover:text-primary-600 transition-colors duration-200">
                Recados
              </Link>
              <span className="w-1 h-1 rounded-full bg-primary-300" />
              <Link to={`/${domain}/confirmar`} className="hover:text-primary-600 transition-colors duration-200">
                RSVP
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />

      {/* Main Content - generous section padding */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer - vows-unfolded style */}
      <footer className="bg-[#f0ece6]/50 border-t border-[#e0d0c8]/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16 text-center">
          <Heart className="w-5 h-5 text-primary-400 mx-auto mb-4" />
          <p className="font-heading text-lg text-[#6a5d54]">
            Com amor, <span className="font-script text-2xl text-primary-600">Mi & John</span>
          </p>
          <div className="divider-ornament mt-4 mb-4" />
          <p className="text-xs text-[#a89e95] tracking-wider uppercase">Criado com ParaSempre</p>
          <div className="mt-8">
            <Link
              to={`/${domain}/admin/login`}
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#d4cfc8] rounded-full text-xs font-medium tracking-wider uppercase text-[#8a7e76] bg-white/80 hover:bg-white hover:text-primary-700 hover:border-primary-200 transition-all duration-300 shadow-soft"
            >
              Acesso Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
