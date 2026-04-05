import { useState } from 'react';
import { useGifts } from '@/hooks/useGifts';
import StatusSelect from '@/components/admin/StatusSelect';
import XlsxUploader from '@/components/admin/XlsxUploader';
import GiftEditModal from '@/components/admin/GiftEditModal';
import { formatCurrency } from '@/lib/utils';
import { updateGift } from '@/lib/services/gifts';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Loader2, ExternalLink, Eye, Star, Pencil, Copy, RefreshCw, ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { GiftItem } from '@/types';
import { addGift, deleteGift, reorderGifts } from '@/lib/services/gifts';
import { api } from '@/lib/api';

export default function AdminGiftsPage() {
  const { gifts, loading, refresh } = useGifts();
  const { domain } = useParams();
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const totalGifts = gifts.length;
  const boughtGifts = gifts.filter(g => g.status === 'comprado').length;
  const reservedGifts = gifts.filter(g => g.status === 'reservado').length;
  const availableGifts = gifts.filter(g => g.status === 'disponivel').length;

  const handleToggleFeatured = async (gift: GiftItem) => {
    await updateGift(gift.id, { is_featured: !gift.is_featured });
    refresh();
  };

  const handleRegenerateImage = async (gift: GiftItem) => {
    setRegenerating(gift.id);
    try {
      await api.post(`/gifts/${gift.id}/regenerate-image`, {});
      refresh();
    } catch {
      alert('Não foi possível regenerar a imagem. Tente novamente.');
    } finally {
      setRegenerating(null);
    }
  };

  const handleDuplicate = async (gift: GiftItem) => {
    setDuplicating(gift.id);
    try {
      await addGift({
        tenant_id: gift.tenant_id,
        name: `${gift.name} (cópia)`,
        description: gift.description,
        price: gift.price,
        room: gift.room,
        color: gift.color,
        store_name: gift.store_name,
        store_link: gift.store_link,
        status: 'disponivel',
        is_featured: false,
        image_url: gift.image_url,
      });
      refresh();
    } finally {
      setDuplicating(null);
    }
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= gifts.length) return;
    setReordering(true);
    try {
      const reordered = [...gifts];
      [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
      await reorderGifts(reordered.map(g => g.id));
      refresh();
    } finally {
      setReordering(false);
    }
  };

  const handleDeleteGift = async (gift: GiftItem) => {
    if (!confirm(`Tem certeza que deseja excluir "${gift.name}"?`)) return;
    await deleteGift(gift.id);
    refresh();
  };

  const handleNewItem = () => {
    setCreatingNew(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Gerenciar Presentes</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {totalGifts} itens · {availableGifts} disponíveis · {reservedGifts} reservados · {boughtGifts} comprados
            </p>
          </div>
        </div>
        <button
          onClick={handleNewItem}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Item
        </button>
      </motion.div>

      {/* Upload */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Importar Planilha</h2>
        <p className="text-sm text-slate-400 mb-4">
          Envie um arquivo .xlsx com os presentes. Colunas: Item, Preço, Link, Descrição, Cor/Variação.
        </p>
        <XlsxUploader onImportComplete={refresh} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3.5 w-16">Ordem</th>
                <th className="px-6 py-3.5">Item</th>
                <th className="px-6 py-3.5">Cômodo</th>
                <th className="px-6 py-3.5">Preço</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {gifts.map((gift, index) => (
                <tr key={gift.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => handleMoveItem(index, 'up')}
                        disabled={index === 0 || reordering}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">{index + 1}</span>
                      <button
                        onClick={() => handleMoveItem(index, 'down')}
                        disabled={index === gifts.length - 1 || reordering}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={gift.image_url || ''}
                          alt=""
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900 truncate max-w-[200px]">{gift.name}</span>
                          {gift.is_featured && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        {gift.color && <div className="text-[11px] text-slate-400">{gift.color}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="uppercase text-[10px] tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded whitespace-nowrap">
                      {gift.room}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap">
                    {formatCurrency(gift.price)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusSelect giftId={gift.id} currentStatus={gift.status} onUpdate={refresh} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleFeatured(gift)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          gift.is_featured
                            ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                            : 'hover:bg-slate-100 text-slate-400 hover:text-amber-500'
                        }`}
                        title={gift.is_featured ? 'Remover destaque' : 'Destacar'}
                      >
                        <Star className={`w-4 h-4 ${gift.is_featured ? 'fill-amber-500' : ''}`} />
                      </button>
                      <button
                        onClick={() => setEditingGift(gift)}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                        title="Editar produto"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(gift)}
                        disabled={duplicating === gift.id}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors disabled:opacity-50"
                        title="Duplicar item"
                      >
                        {duplicating === gift.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRegenerateImage(gift)}
                        disabled={regenerating === gift.id}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                        title="Regenerar imagem"
                      >
                        {regenerating === gift.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </button>
                      {gift.store_link && (
                        <a
                          href={gift.store_link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Ver na loja"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        to={`/${domain}/presentes/${gift.id}`}
                        target="_blank"
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                        title="Ver no site"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteGift(gift)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title="Excluir item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {gifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    Nenhum presente cadastrado. Importe uma planilha acima para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gift Edit Modal */}
      <AnimatePresence>
        {editingGift && (
          <GiftEditModal
            gift={editingGift}
            onClose={() => setEditingGift(null)}
            onSaved={refresh}
          />
        )}
        {creatingNew && (
          <GiftEditModal
            gift={null}
            onClose={() => setCreatingNew(false)}
            onSaved={refresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
