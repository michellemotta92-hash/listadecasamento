import { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Plus, Save, X } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { addGift, updateGift } from '@/lib/services/gifts';
import { uploadImage } from '@/lib/services/images';
import { GiftItem, GiftStatus, RoomType } from '@/types';

interface Props {
  gift: GiftItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function GiftEditModal({ gift, onClose, onSaved }: Props) {
  const isNew = !gift;
  const [form, setForm] = useState({
    name: gift?.name || '',
    description: gift?.description || '',
    price: gift?.price || 0,
    room: (gift?.room || 'outro') as RoomType,
    color: gift?.color || '',
    store_name: gift?.store_name || '',
    store_link: gift?.store_link || '',
    status: (gift?.status || 'disponivel') as GiftStatus,
    is_featured: gift?.is_featured || false,
    image_url: gift?.image_url || null,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: form.price,
        room: form.room,
        color: form.color || null,
        store_name: form.store_name || null,
        store_link: form.store_link || null,
        status: form.status,
        is_featured: form.is_featured,
        image_url: form.image_url,
      };

      if (isNew) {
        await addGift({ tenant_id: '', ...payload });
      } else {
        await updateGift(gift.id, payload);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const path = `products/${isNew ? Date.now() : gift?.id}.${file.name.split('.').pop()}`;
    const url = await uploadImage(file, path);
    setForm(f => ({ ...f, image_url: url }));
  };

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const rooms: { value: RoomType; label: string }[] = [
    { value: 'cozinha', label: 'Cozinha' },
    { value: 'sala', label: 'Sala' },
    { value: 'quarto', label: 'Quarto' },
    { value: 'banheiro', label: 'Banheiro' },
    { value: 'lavanderia', label: 'Lavanderia' },
    { value: 'outro', label: 'Outro' },
  ];

  const statuses: { value: GiftStatus; label: string }[] = [
    { value: 'disponivel', label: 'Disponível' },
    { value: 'reservado', label: 'Reservado' },
    { value: 'comprado', label: 'Comprado' },
  ];

  const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelClass = 'mb-1.5 block text-xs font-medium text-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">{isNew ? 'Novo Presente' : 'Editar Presente'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <ImageUploader currentUrl={form.image_url} onUpload={handleImageUpload} onRemove={() => set('image_url', null)} label="Foto do produto" />

          <div>
            <label className={labelClass}>Nome do produto *</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="Nome do presente" required />
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder="Descrição do produto" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Preço (R$) *</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set('price', parseFloat(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cômodo</label>
              <select value={form.room} onChange={(e) => set('room', e.target.value)} className={`${inputClass} cursor-pointer`}>
                {rooms.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Cor / Variação</label>
              <input type="text" value={form.color} onChange={(e) => set('color', e.target.value)} className={inputClass} placeholder="Ex: Vermelho, 220V" />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={`${inputClass} cursor-pointer`}>
                {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Nome da loja</label>
              <input type="text" value={form.store_name} onChange={(e) => set('store_name', e.target.value)} className={inputClass} placeholder="Shopee, Amazon, etc." />
            </div>
            <div>
              <label className={labelClass}>Link da loja</label>
              <input type="url" value={form.store_link} onChange={(e) => set('store_link', e.target.value)} className={inputClass} placeholder="https://..." />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500" />
            <span className="text-sm text-slate-700">Marcar como "Mais Desejado"</span>
          </label>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white p-6">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isNew ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isNew ? 'Criar Presente' : 'Salvar alterações'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
