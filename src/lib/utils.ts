import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RoomType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseBRLPrice(priceStr: string): number {
  if (!priceStr) return 0;
  const cleaned = priceStr
    .replace(/R\$\s*/gi, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

export function guessRoom(name: string, description: string): RoomType {
  const text = `${name} ${description}`.toLowerCase();
  if (
    text.includes('panela') || text.includes('cozinha') || text.includes('utensílio') ||
    text.includes('utensilio') || text.includes('prato') || text.includes('xícara') ||
    text.includes('xicara') || text.includes('cafeteira') || text.includes('liquidificador') ||
    text.includes('air fryer') || text.includes('fritadeira') || text.includes('sanduicheira') ||
    text.includes('cuscuz') || text.includes('fruteira') || text.includes('galheteiro') ||
    text.includes('saleiro') || text.includes('condimento') || text.includes('escorredor') ||
    text.includes('potes') || text.includes('lixeira') || text.includes('americano') ||
    text.includes('panificadora') || text.includes('geladeira') || text.includes('café')
  ) return 'cozinha';
  if (
    text.includes('cama') || text.includes('lençol') || text.includes('lencol') ||
    text.includes('edredom') || text.includes('coberdrom') || text.includes('cobre leito') ||
    text.includes('travesseiro')
  ) return 'quarto';
  if (text.includes('banheiro') || text.includes('toalha')) return 'banheiro';
  if (
    text.includes('lavanderia') || text.includes('varal') || text.includes('tábua') ||
    text.includes('tabua') || text.includes('ferro de passar') || text.includes('limpeza') ||
    text.includes('pano de chão') || text.includes('pano de ch') ||
    text.includes('armário') || text.includes('armario')
  ) return 'lavanderia';
  if (
    text.includes('sala') || text.includes('tapete') || text.includes('taça') ||
    text.includes('sofá') || text.includes('mesa') || text.includes('cadeira') ||
    text.includes('relógio') || text.includes('relogio') || text.includes('aparador') ||
    text.includes('buffet') || text.includes('porta')
  ) return 'sala';
  return 'outro';
}
