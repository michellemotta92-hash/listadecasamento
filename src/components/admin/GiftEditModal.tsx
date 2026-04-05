import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { GiftItem, RoomType, GiftStatus } from '@/types';
import { updateGift } from '@/lib/services/gifts';
import { uploadImage } from '@/lib/services/images';
import ImageUploader from './ImageUploader';

interface Props {
  gift: GiftItem;
  onClose: () => void;
  onSaved: () => void;
}

export default function GiftEditModal({ gift, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: gift.name,
    description: gift.description || '',
    price: gift.price,
    room: gift.room as RoomType,
    color: gift.color || '',
    store_name: gift.store_name || '',
    store_link: gift.store_link || '',
    status: gift.status as GiftStatus,
    is_featured: gift.is_featured,
    image_url: gift.image_url,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateGift(gift.id, {
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
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const path = `products/${gift.id}.${file.name.split('.').pop()}`;
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

  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  const labelClass = 'block text-xs font-medium text-slate-500 mb-1.5';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-lg font-semibold text-slate-900">Editar Presente</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Image */}
          <ImageUploader
            currentUrl={form.image_url}
            onUpload={handleImageUpload}
            onRemove={() => set('image_url', null)}
            label="Foto do produto"
          />

          {/* Name */}
          <div>
            <label className={labelClass}>Nome do produto *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputClass}
              placeholder="Nome do presente"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Descrição do produto"
            />
          </div>

          {/* Price + Room */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cômodo</label>
              <select
                value={form.room}
                onChange={(e) => set('room', e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {rooms.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cor / Variação</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
                className={inputClass}
                placeholder="Ex: Vermelho, 220V"
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {statuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Store name + link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nome da loja</label>
              <input
                type="text"
                value={form.store_name}
                onChange={(e) => set('store_name', e.target.value)}
                className={inputClass}
                placeholder="Shopee, Amazon, etc."
              />
            </div>
            <div>
              <label className={labelClass}>Link da loja</label>
              <input
                type="url"
                value={form.store_link}
                onChange={(e) => set('store_link', e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Featured toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => set('is_featured', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">Marcar como "Mais Desejado"</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar alterações
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
