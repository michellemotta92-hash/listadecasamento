import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  Loader2,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from 'lucide-react';
import AdminSearchInput from '@/components/admin/AdminSearchInput';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import GiftEditModal from '@/components/admin/GiftEditModal';
import MetricCard from '@/components/admin/MetricCard';
import StatusFilter from '@/components/admin/StatusFilter';
import StatusSelect from '@/components/admin/StatusSelect';
import XlsxUploader from '@/components/admin/XlsxUploader';
import { useGifts } from '@/hooks/useGifts';
import { formatCurrency, parseCurrencyValue } from '@/lib/utils';
import { addGift, deleteGift, reorderGifts, updateGift } from '@/lib/services/gifts';
import { GiftItem, GiftStatus, RoomType } from '@/types';

type GiftStatusFilter = 'todos' | GiftStatus;
type RoomFilter = 'todos' | RoomType;

const statusOptions: { value: GiftStatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'disponivel', label: 'Disponíveis' },
  { value: 'reservado', label: 'Reservados' },
  { value: 'comprado', label: 'Comprados' },
];

const roomOptions: { value: RoomFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os cômodos' },
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'sala', label: 'Sala' },
  { value: 'quarto', label: 'Quarto' },
  { value: 'banheiro', label: 'Banheiro' },
  { value: 'lavanderia', label: 'Lavanderia' },
  { value: 'outro', label: 'Outro' },
];

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function AdminGiftsPage() {
  const { gifts, loading, refresh } = useGifts();
  const { domain } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') || 'todos') as GiftStatusFilter;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GiftStatusFilter>(
    statusOptions.some(option => option.value === initialStatus) ? initialStatus : 'todos',
  );
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('todos');
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GiftItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');

  const filteredGifts = useMemo(() => {
    const query = normalizeText(search.trim());
    return gifts.filter((gift) => {
      const matchesSearch = !query || normalizeText(`${gift.name} ${gift.description || ''} ${gift.color || ''}`).includes(query);
      const matchesStatus = statusFilter === 'todos' || gift.status === statusFilter;
      const matchesRoom = roomFilter === 'todos' || gift.room === roomFilter;
      return matchesSearch && matchesStatus && matchesRoom;
    });
  }, [gifts, roomFilter, search, statusFilter]);

  const totalGifts = gifts.length;
  const boughtGifts = gifts.filter(g => g.status === 'comprado').length;
  const reservedGifts = gifts.filter(g => g.status === 'reservado').length;
  const availableGifts = gifts.filter(g => g.status === 'disponivel').length;
  const filteredValue = filteredGifts.reduce((sum, gift) => sum + parseCurrencyValue(gift.price), 0);
  const filteredBoughtValue = filteredGifts
    .filter(gift => gift.status === 'comprado')
    .reduce((sum, gift) => sum + parseCurrencyValue(gift.price), 0);
  const hasFilters = search.trim() !== '' || statusFilter !== 'todos' || roomFilter !== 'todos';

  const updateStatusFilter = (value: GiftStatusFilter) => {
    setStatusFilter(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'todos') nextParams.delete('status');
    else nextParams.set('status', value);
    setSearchParams(nextParams, { replace: true });
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('todos');
    setRoomFilter('todos');
    setSearchParams({}, { replace: true });
  };

  const handleToggleFeatured = async (gift: GiftItem) => {
    setActionError('');
    try {
      await updateGift(gift.id, { is_featured: !gift.is_featured });
      refresh();
    } catch {
      setActionError('Não foi possível atualizar o destaque do presente.');
    }
  };

  const handleDuplicate = async (gift: GiftItem) => {
    setActionError('');
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
    } catch {
      setActionError('Não foi possível duplicar o presente.');
    } finally {
      setDuplicating(null);
    }
  };

  const handleMoveItem = async (giftId: string, direction: 'up' | 'down') => {
    const index = gifts.findIndex(gift => gift.id === giftId);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || newIndex < 0 || newIndex >= gifts.length) return;
    setReordering(true);
    setActionError('');
    try {
      const reordered = [...gifts];
      [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
      await reorderGifts(reordered.map(g => g.id));
      refresh();
    } catch {
      setActionError('Não foi possível reordenar os presentes.');
    } finally {
      setReordering(false);
    }
  };

  const handleDeleteGift = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError('');
    try {
      await deleteGift(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch {
      setActionError('Não foi possível excluir o presente.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Package className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Gerenciar Presentes</h1>
            <p className="mt-0.5 text-xs text-slate-400">
              {totalGifts} itens · {availableGifts} disponíveis · {reservedGifts} reservados · {boughtGifts} comprados
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreatingNew(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Novo Item
        </button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Itens Filtrados" value={filteredGifts.length} sub={`de ${totalGifts}`} icon={Package} color="bg-slate-100 text-slate-600" />
        <MetricCard label="Valor Filtrado" value={formatCurrency(filteredValue)} sub="soma da lista exibida" icon={Package} color="bg-primary-50 text-primary-600" />
        <MetricCard label="Arrecadado no Filtro" value={formatCurrency(filteredBoughtValue)} sub="somente comprados" icon={Star} color="bg-sage-50 text-sage-600" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_190px_190px_auto]">
          <AdminSearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, descrição ou variação..." />
          <StatusFilter<GiftStatusFilter> value={statusFilter} onChange={updateStatusFilter} options={statusOptions} />
          <StatusFilter<RoomFilter> value={roomFilter} onChange={setRoomFilter} options={roomOptions} />
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </button>
        </div>
        {actionError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{actionError}</p>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Importar Planilha</h2>
        <p className="mb-4 text-sm text-slate-400">
          Envie um arquivo .xlsx com os presentes. Colunas: Item, Preço, Link, Descrição, Cor/Variação.
        </p>
        <XlsxUploader onImportComplete={refresh} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-16 px-3 py-3.5">Ordem</th>
                <th className="px-6 py-3.5">Item</th>
                <th className="px-6 py-3.5">Cômodo</th>
                <th className="px-6 py-3.5">Preço</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {filteredGifts.map((gift) => {
                const originalIndex = gifts.findIndex(item => item.id === gift.id);
                const canReorder = !hasFilters && !reordering;
                return (
                  <tr key={gift.id} className="transition hover:bg-slate-50/50">
                    <td className="px-3 py-4">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          onClick={() => handleMoveItem(gift.id, 'up')}
                          disabled={!canReorder || originalIndex === 0}
                          className="rounded p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
                          title={hasFilters ? 'Limpe os filtros para reordenar' : 'Mover para cima'}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <span className="font-mono text-[10px] text-slate-400">{originalIndex + 1}</span>
                        <button
                          onClick={() => handleMoveItem(gift.id, 'down')}
                          disabled={!canReorder || originalIndex === gifts.length - 1}
                          className="rounded p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
                          title={hasFilters ? 'Limpe os filtros para reordenar' : 'Mover para baixo'}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <img src={gift.image_url || ''} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="max-w-[240px] truncate font-medium text-slate-900">{gift.name}</span>
                            {gift.is_featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />}
                          </div>
                          {gift.color && <div className="text-[11px] text-slate-400">{gift.color}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="whitespace-nowrap rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {gift.room}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">{formatCurrency(gift.price)}</td>
                    <td className="px-6 py-4">
                      <StatusSelect giftId={gift.id} currentStatus={gift.status} onUpdate={refresh} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleFeatured(gift)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            gift.is_featured ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100 hover:text-amber-500'
                          }`}
                          title={gift.is_featured ? 'Remover destaque' : 'Destacar'}
                        >
                          <Star className={`h-4 w-4 ${gift.is_featured ? 'fill-amber-500' : ''}`} />
                        </button>
                        <button onClick={() => setEditingGift(gift)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-primary-50 hover:text-primary-600" title="Editar produto">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDuplicate(gift)} disabled={duplicating === gift.id} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-green-50 hover:text-green-600 disabled:opacity-50" title="Duplicar item">
                          {duplicating === gift.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                        </button>
                        {gift.store_link && (
                          <a href={gift.store_link} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" title="Ver na loja">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Link to={`/${domain}/presentes/${gift.id}`} target="_blank" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-primary-50 hover:text-primary-600" title="Ver no site">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => setDeleteTarget(gift)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600" title="Excluir item">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredGifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    Nenhum presente encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingGift && <GiftEditModal gift={editingGift} onClose={() => setEditingGift(null)} onSaved={refresh} />}
        {creatingNew && <GiftEditModal gift={null} onClose={() => setCreatingNew(false)} onSaved={refresh} />}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir presente"
        message={`Tem certeza que deseja excluir "${deleteTarget?.name || ''}"? Essa a??o n?o pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteGift}
      />
    </div>
  );
}
