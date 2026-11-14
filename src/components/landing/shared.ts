export type ProcessCategory = 'peticao' | 'lei' | 'zeladoria';

export interface ProcessItem {
  id: string;
  category: ProcessCategory;
  location: string;
  title: string;
  summary: string;
  /** Petições e zeladoria: número de apoios. Leis: votos a favor. */
  supporters: number;
  /** Apenas leis: votos contra. */
  against?: number;
  goal?: number;
  isUserCreated?: boolean;
}

export const CATEGORY_LABEL: Record<ProcessCategory, string> = {
  peticao: 'Abaixo-Assinado',
  lei: 'Lei da Câmara (IA)',
  zeladoria: 'Zeladoria do Bairro',
};

/** Formata número no padrão brasileiro (14.892) sem depender de ICU no servidor. */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export interface CityGoal {
  name: string;
  uf: string;
  current: number;
  goal: number;
  active?: boolean;
}

export const CITY_GOALS: CityGoal[] = [
  { name: 'São José dos Campos', uf: 'SP', current: 3420, goal: 3420, active: true },
  { name: 'Jacareí', uf: 'SP', current: 268, goal: 300 },
  { name: 'Taubaté', uf: 'SP', current: 194, goal: 300 },
  { name: 'São Paulo', uf: 'SP', current: 412, goal: 500 },
];

export function normalizeCity(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

