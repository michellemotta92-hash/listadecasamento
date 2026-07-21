import { useEffect } from 'react';

import { Outlet, Link, useParams, useLocation } from 'react-router';

import { motion } from 'motion/react';

import { Heart } from 'lucide-react';

import { useTenant } from '@/contexts/TenantContext';

import { useSiteConfig } from '@/hooks/useSiteConfig';

import { PublicPage } from '@/types';

import { applyTheme } from '@/lib/themes';



const navLinks: { label: string; path: string; key: PublicPage | null }[] = [

  { label: 'Home', path: '', key: null },

  { label: 'Lista de Presentes', path: '/presentes', key: 'presentes' },

  { label: 'Pix', path: '/pix', key: 'pix' },

  { label: 'Recados', path: '/recados', key: 'recados' },

  { label: 'RSVP', path: '/confirmar', key: 'confirmar' },

];



export default function PublicLayout() {

  const { domain } = useParams();

  const location = useLocation();

  const { slug, name: tenantName } = useTenant();

  const { data: config = {}, isLoading: configLoading } = useSiteConfig();



  useEffect(() => {

    const params = new URLSearchParams(window.location.search);

    const previewTheme = params.get('preview_theme');

    applyTheme(previewTheme || config.theme || 'default');

    const coupleName = config.couple_name || tenantName;

    if (coupleName) {

      document.title = `${coupleName} — Casamento`;

    }

    const meta = document.querySelector('meta[name="description"]');

    if (meta && config.meta_description) {

      meta.setAttribute('content', config.meta_description);

    }

    return () => {

      document.documentElement.removeAttribute('style');

      document.body.style.backgroundColor = '';

      document.body.style.color = '';

    };

  }, [config.theme, config.couple_name, config.meta_description, tenantName]);



  const hiddenPages = config.hidden_pages || [];

  const coupleName = config.couple_name || tenantName || 'Casal';

  const pixEnabled = config.pix?.enabled && config.pix?.key;



  const visibleNavLinks = navLinks.filter((link) => {

    if (link.key === 'pix') return pixEnabled && !hiddenPages.includes('pix');

    if (!link.key) return true;

    return !hiddenPages.includes(link.key);

  });



  const currentPath = location.pathname.replace(`/${domain}`, '') || '/';

  const currentPageKey = navLinks.find(

    (l) => l.path !== '' && currentPath.startsWith(l.path)

  )?.key;



  if (!configLoading && currentPageKey && hiddenPages.includes(currentPageKey)) {

    return (

      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">

        <div className="text-center space-y-4 max-w-md px-6">

          <Heart className="w-8 h-8 text-primary-300 mx-auto" />

          <h2 className="font-script text-4xl text-primary-700">Em breve</h2>

          <p className="text-[#8a7e76] font-light leading-relaxed">

            Esta página ainda não está disponível. Volte mais tarde!

          </p>

          <Link

            to={`/${slug}`}

            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm tracking-wide uppercase transition-colors duration-200"

          >

            &larr; Voltar ao início

          </Link>

        </div>

      </div>

    );

  }



  return (

    <div className="min-h-screen bg-[#faf8f5] text-[#3d3530] font-sans">

      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/80 backdrop-blur-md border-b border-[#e0d0c8]/50">

        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-center h-16 md:h-20">

          <div className="text-center">

            <Link to={`/${slug}`} className="group">

              <h1 className="font-script text-3xl md:text-4xl text-primary-700 transition-colors group-hover:text-primary-500">

                {coupleName}

              </h1>

            </Link>

            <nav className="mt-1 flex items-center justify-center gap-8 text-xs uppercase tracking-[0.15em] text-[#8a7e76] font-medium">

              {visibleNavLinks.map((link, i) => (

                <span key={link.path} className="flex items-center gap-8">

                  {i > 0 && <span className="w-1 h-1 rounded-full bg-primary-300" />}

                  <Link

                    to={`/${slug}${link.path}`}

                    className="hover:text-primary-600 transition-colors duration-200"

                  >

                    {link.label}

                  </Link>

                </span>

              ))}

            </nav>

          </div>

        </div>

      </header>



      <div className="h-16 md:h-20" />



      <main className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">

        <motion.div

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.6, ease: 'easeOut' }}

        >

          <Outlet />

        </motion.div>

      </main>



      <footer className="bg-[#f0ece6]/50 border-t border-[#e0d0c8]/50">

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16 text-center">

          <Heart className="w-5 h-5 text-primary-400 mx-auto mb-4" />

          <p className="font-heading text-lg text-[#6a5d54]">

            Com amor, <span className="font-script text-2xl text-primary-600">{coupleName}</span>

          </p>

          <div className="divider-ornament mt-4 mb-4" />

          <p className="text-xs text-[#a89e95] tracking-wider uppercase">Criado com ParaSempre</p>

          <div className="mt-8">

            <Link

              to={`/${slug}/admin/login`}

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
