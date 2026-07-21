import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSiteSchema, CreateSiteForm } from '@/features/platform/schemas';
import { createSiteWithDemo } from '@/features/platform/api';
import { PlatformPageHeader } from '@/components/layout/PlatformLayout';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

export default function CreateSiteWizard() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateSiteForm>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: { couple_name: '', slug: '', event_date: '' },
  });

  const coupleName = watch('couple_name');

  const onBlurName = () => {
    const currentSlug = watch('slug');
    if (!currentSlug && coupleName) {
      setValue('slug', slugify(coupleName), { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CreateSiteForm) => {
    setSubmitError('');
    try {
      const site = await createSiteWithDemo({
        slug: data.slug,
        couple_name: data.couple_name,
        event_date: data.event_date || undefined,
      });
      navigate(`/${site.slug}/admin`, { replace: true });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erro ao criar site');
    }
  };

  return (
    <>
      <PlatformPageHeader
        title="Novo site de casamento"
        description="Escolha o endereço do site. Você poderá personalizar tudo no painel."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-lg space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-8"
      >
        {submitError && (
          <p className="text-sm text-rose-400 bg-rose-950/50 border border-rose-900 rounded-lg px-3 py-2">
            {submitError}
          </p>
        )}

        <div>
          <label className="block text-xs text-slate-400 mb-1">Nome do casal</label>
          <input
            {...register('couple_name')}
            onBlur={onBlurName}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            placeholder="Maria & João"
          />
          {errors.couple_name && (
            <p className="text-xs text-rose-400 mt-1">{errors.couple_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Endereço do site</label>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-slate-500">parasempre.app/</span>
            <input
              {...register('slug')}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              placeholder="maria-e-joao"
            />
          </div>
          {errors.slug && <p className="text-xs text-rose-400 mt-1">{errors.slug.message}</p>}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Data do casamento (opcional)</label>
          <input
            type="date"
            {...register('event_date')}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Criando...' : 'Criar site e abrir painel'}
        </button>
      </form>
    </>
  );
}
