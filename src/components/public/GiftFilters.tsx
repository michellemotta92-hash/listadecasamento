import { useSearchParams } from 'react-router';
import { SlidersHorizontal, Star } from 'lucide-react';

export default function GiftFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentRoom = searchParams.get('room') || '';
  const currentSort = searchParams.get('sort') || '';
  const isFeatured = searchParams.get('featured') === '1';

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const toggleFeatured = () => {
    const params = new URLSearchParams(searchParams);
    if (isFeatured) {
      params.delete('featured');
    } else {
      params.set('featured', '1');
    }
    setSearchParams(params);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-2">
      <SlidersHorizontal className="w-4 h-4 text-[#b5aea5]" />
      <select
        value={currentRoom}
        onChange={(e) => updateParams('room', e.target.value)}
        className="px-4 py-2.5 rounded-full border border-[#e0d0c8] bg-white/80 text-sm text-[#6a5d54] font-body focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 cursor-pointer transition-all duration-300 hover:border-primary-300"
      >
        <option value="">Todos os cômodos</option>
        <option value="cozinha">Cozinha</option>
        <option value="sala">Sala</option>
        <option value="quarto">Quarto</option>
        <option value="banheiro">Banheiro</option>
        <option value="lavanderia">Lavanderia</option>
        <option value="outro">Outro</option>
      </select>
      <select
        value={currentSort}
        onChange={(e) => updateParams('sort', e.target.value)}
        className="px-4 py-2.5 rounded-full border border-[#e0d0c8] bg-white/80 text-sm text-[#6a5d54] font-body focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 cursor-pointer transition-all duration-300 hover:border-primary-300"
      >
        <option value="">Ordenar por preço</option>
        <option value="asc">Menor preço</option>
        <option value="desc">Maior preço</option>
      </select>
      <button
        onClick={toggleFeatured}
        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-body cursor-pointer transition-all duration-300 ${
          isFeatured
            ? 'border-amber-300 bg-amber-50 text-amber-700'
            : 'border-[#e0d0c8] bg-white/80 text-[#6a5d54] hover:border-amber-300'
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
        Mais desejados
      </button>
    </div>
  );
}
