import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Info, Image as ImageIcon } from 'lucide-react';
import { appConfig } from '@/lib/config';
import ImageUploader from '@/components/admin/ImageUploader';
import { getSiteConfig, updateSiteConfig } from '@/lib/services/site-config';
import { uploadImage } from '@/lib/services/images';
import { SiteConfig } from '@/types';

export default function AdminConfigPage() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteConfig().then(setSiteConfig);
  }, []);

  const handleHeroUpload = async (file: File) => {
    setSaving(true);
    try {
      const url = await uploadImage(file, 'site/hero.jpg');
      await updateSiteConfig({ hero_image_url: url });
      setSiteConfig(prev => ({ ...prev, hero_image_url: url }));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setSaving(true);
    try {
      const url = await uploadImage(file, 'site/logo.png');
      await updateSiteConfig({ logo_url: url });
      setSiteConfig(prev => ({ ...prev, logo_url: url }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-400 text-xs mt-0.5">Gerencie as configurações do seu site</p>
        </div>
      </motion.div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Status do Sistema</p>
            <p>
              Modo: <strong>{appConfig.isDemoMode ? 'Demonstração' : 'Produção'}</strong>
            </p>
            <p className="mt-2 text-xs text-blue-600">
              {appConfig.isDemoMode
                ? 'Os dados estão em memória e serão perdidos ao recarregar a página.'
                : 'Conectado ao PostgreSQL. Os dados são persistidos no banco de dados.'
              }
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Informações do Evento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Nome do Casal</label>
              <input
                type="text"
                defaultValue="Mi & John"
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={appConfig.isDemoMode}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Data do Evento</label>
              <input
                type="date"
                defaultValue="2026-10-12"
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={appConfig.isDemoMode}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Local</label>
              <input
                type="text"
                defaultValue="Fazenda Paraíso, São Paulo, SP"
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={appConfig.isDemoMode}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Horário</label>
              <input
                type="time"
                defaultValue="16:00"
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={appConfig.isDemoMode}
              />
            </div>
          </div>
          {appConfig.isDemoMode && (
            <p className="text-xs text-slate-400">
              Edição desabilitada no modo demonstração. Conecte ao PostgreSQL para habilitar.
            </p>
          )}
        </div>
      </div>

      {/* Site Images */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Imagens do Site</h3>
            <p className="text-xs text-slate-400 mt-0.5">Altere as imagens da página inicial</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUploader
            currentUrl={siteConfig.hero_image_url || null}
            onUpload={handleHeroUpload}
            onRemove={async () => {
              await updateSiteConfig({ hero_image_url: undefined });
              setSiteConfig(prev => ({ ...prev, hero_image_url: undefined }));
            }}
            aspectRatio="wide"
            label="Foto do Casal (Hero)"
          />
          <ImageUploader
            currentUrl={siteConfig.logo_url || null}
            onUpload={handleLogoUpload}
            onRemove={async () => {
              await updateSiteConfig({ logo_url: undefined });
              setSiteConfig(prev => ({ ...prev, logo_url: undefined }));
            }}
            aspectRatio="square"
            label="Logo / Monograma"
          />
        </div>

        {saving && (
          <p className="text-xs text-primary-500 animate-pulse">Salvando...</p>
        )}
      </div>
    </div>
  );
}
