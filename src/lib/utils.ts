import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RoomType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseCurrencyValue(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;

  const cleaned = value
    .replace(/R\$\s*/gi, '')
    .replace(/\s/g, '')
    .trim();

  if (!cleaned) return 0;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalized = cleaned;

  if (hasComma) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasDot) {
    const parts = cleaned.split('.');
    const lastPart = parts[parts.length - 1];
    normalized = parts.length > 2 || lastPart.length !== 2
      ? cleaned.replace(/\./g, '')
      : cleaned;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: unknown): string {
  const numericValue = parseCurrencyValue(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

export function parseBRLPrice(priceStr: string): number {
  return parseCurrencyValue(priceStr);
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
