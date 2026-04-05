import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Info, Image as ImageIcon, Save, Check, Eye, EyeOff, Type } from 'lucide-react';
import { appConfig } from '@/lib/config';
import ImageUploader from '@/components/admin/ImageUploader';
import { getSiteConfig, updateSiteConfig } from '@/lib/services/site-config';
import { uploadImage } from '@/lib/services/images';
import { SiteConfig, PublicPage, PageTexts } from '@/types';

export default function AdminConfigPage() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Controlled form fields
  const [coupleName, setCoupleName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [hiddenPages, setHiddenPages] = useState<PublicPage[]>([]);
  const [pageTexts, setPageTexts] = useState<PageTexts>({});

  useEffect(() => {
    getSiteConfig().then((config) => {
      setSiteConfig(config);
      setCoupleName(config.couple_name || 'Mi & John');
      setEventDate(config.event_date || '2026-10-12');
      setEventTime(config.event_time || '16:00');
      setEventLocation(config.event_location || 'Fazenda Paraíso, São Paulo, SP');
      setHiddenPages(config.hidden_pages || []);
      setPageTexts(config.page_texts || {});
    });
  }, []);

  const updateText = (key: keyof PageTexts, value: string) => {
    setPageTexts(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveEventInfo = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updates: Partial<SiteConfig> = {
        couple_name: coupleName,
        event_date: eventDate,
        event_time: eventTime,
        event_location: eventLocation,
        hidden_pages: hiddenPages,
        page_texts: pageTexts,
      };
      await updateSiteConfig(updates);
      setSiteConfig(prev => ({ ...prev, ...updates }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

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
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Data do Evento</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Local</label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Horário</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Page Visibility */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Eye className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Visibilidade das Páginas</h3>
            <p className="text-xs text-slate-400 mt-0.5">Oculte páginas do site público. Páginas ocultas ficam como rascunho e só o admin pode acessar.</p>
          </div>
        </div>

        <div className="space-y-3">
          {([
            { key: 'presentes' as PublicPage, label: 'Lista de Presentes', desc: 'Página com todos os presentes sugeridos' },
            { key: 'recados' as PublicPage, label: 'Recados', desc: 'Mural de recados dos convidados' },
            { key: 'confirmar' as PublicPage, label: 'RSVP / Confirmação de Presença', desc: 'Formulário de confirmação dos convidados' },
          ]).map((page) => {
            const isHidden = hiddenPages.includes(page.key);
            return (
              <div
                key={page.key}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  isHidden ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isHidden ? (
                    <EyeOff className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-green-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {page.label}
                      {isHidden && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                          Rascunho
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{page.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setHiddenPages(prev =>
                      prev.includes(page.key)
                        ? prev.filter(p => p !== page.key)
                        : [...prev, page.key]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isHidden
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {isHidden ? 'Publicar' : 'Ocultar'}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400">
          Clique em "Salvar Alterações" abaixo para aplicar as mudanças de visibilidade.
        </p>
      </div>

      {/* Page Texts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <Type className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Textos das Páginas</h3>
            <p className="text-xs text-slate-400 mt-0.5">Personalize os títulos e textos de cada página do site. Deixe em branco para usar o texto padrão.</p>
          </div>
        </div>

        {/* Home */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Página Inicial</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Subtítulo</label>
              <input
                type="text"
                value={pageTexts.home_subtitle || ''}
                onChange={(e) => updateText('home_subtitle', e.target.value)}
                placeholder="Estamos nos casando"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Texto do card Presentes</label>
              <input
                type="text"
                value={pageTexts.home_gifts_card || ''}
                onChange={(e) => updateText('home_gifts_card', e.target.value)}
                placeholder="Veja nossa lista de presentes sugeridos."
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Descrição principal</label>
            <textarea
              value={pageTexts.home_description || ''}
              onChange={(e) => updateText('home_description', e.target.value)}
              placeholder="Estamos muito felizes em compartilhar esse momento tão especial com vocês. Aqui você encontra todas as informações sobre o nosso grande dia."
              rows={2}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
        </div>

        {/* Gifts */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lista de Presentes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Subtítulo</label>
              <input
                type="text"
                value={pageTexts.gifts_subtitle || ''}
                onChange={(e) => updateText('gifts_subtitle', e.target.value)}
                placeholder="Nossa lista"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Título</label>
              <input
                type="text"
                value={pageTexts.gifts_title || ''}
                onChange={(e) => updateText('gifts_title', e.target.value)}
                placeholder="Lista de Presentes"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Descrição</label>
            <textarea
              value={pageTexts.gifts_description || ''}
              onChange={(e) => updateText('gifts_description', e.target.value)}
              placeholder="Montamos nossa casa com muito carinho. Se desejar nos presentear, escolhemos alguns itens que adoraríamos ter."
              rows={2}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recados</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Subtítulo</label>
              <input
                type="text"
                value={pageTexts.messages_subtitle || ''}
                onChange={(e) => updateText('messages_subtitle', e.target.value)}
                placeholder="Mural"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Título</label>
              <input
                type="text"
                value={pageTexts.messages_title || ''}
                onChange={(e) => updateText('messages_title', e.target.value)}
                placeholder="Recados & Votos"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Descrição</label>
            <textarea
              value={pageTexts.messages_description || ''}
              onChange={(e) => updateText('messages_description', e.target.value)}
              placeholder="Deixe uma mensagem carinhosa para os noivos. Cada palavra sera guardada com muito amor."
              rows={2}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
        </div>

        {/* RSVP */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">RSVP / Confirmação de Presença</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Subtítulo</label>
              <input
                type="text"
                value={pageTexts.rsvp_subtitle || ''}
                onChange={(e) => updateText('rsvp_subtitle', e.target.value)}
                placeholder="RSVP"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Título</label>
              <input
                type="text"
                value={pageTexts.rsvp_title || ''}
                onChange={(e) => updateText('rsvp_title', e.target.value)}
                placeholder="Confirme sua Presenca"
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Descrição</label>
            <textarea
              value={pageTexts.rsvp_description || ''}
              onChange={(e) => updateText('rsvp_description', e.target.value)}
              placeholder="Ficaremos muito felizes com a sua presenca. Por favor, confirme ate o dia 01/09/2026."
              rows={2}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
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

      {/* Save Button - Bottom */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Salve todas as alterações de configuração do evento e visibilidade.</p>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs text-green-600 animate-pulse">Configurações salvas com sucesso!</span>
            )}
            <button
              onClick={handleSaveEventInfo}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
