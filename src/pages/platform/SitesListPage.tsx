import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink, Gift } from 'lucide-react';
import { listSitesWithDemo } from '@/features/platform/api';
import { SiteSummary } from '@/types/platform';
import { NewSiteLink, PlatformPageHeader } from '@/components/layout/PlatformLayout';
import { Skeleton } from '@/shared/ui/Skeleton';

export default function SitesListPage() {
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listSitesWithDemo()
      .then(setSites)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PlatformPageHeader
        title="Meus sites"
        description="Cada site tem seu endereço e painel administrativo."
        action={<NewSiteLink />}
      />

      {error && (
        <p className="text-rose-400 text-sm mb-4 bg-rose-950/40 border border-rose-900 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 bg-slate-800 rounded-xl" />
          <Skeleton className="h-32 bg-slate-800 rounded-xl" />
        </div>
      )}

      {!loading && sites.length === 0 && (
        <div className="text-center py-16 border border-dashed border-slate-700 rounded-2xl">
          <p className="text-slate-400 mb-4">Você ainda não criou nenhum site.</p>
          <NewSiteLink />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sites.map((site) => (
          <article
            key={site.id}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors"
          >
            <h2 className="text-lg font-medium text-white">{site.couple_name}</h2>
            <p className="text-slate-500 text-sm mt-1">/{site.slug}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                {site.gift_count} presentes
              </span>
              <span className="uppercase tracking-wider">{site.plan}</span>
            </div>
            <div className="flex gap-3 mt-4">
              <Link
                to={`/${site.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-rose-400 hover:text-rose-300"
              >
                <ExternalLink className="w-4 h-4" />
                Ver site
              </Link>
              <Link
                to={`/${site.slug}/admin`}
                className="text-sm text-slate-300 hover:text-white"
              >
                Painel admin →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
