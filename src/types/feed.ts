export type FeedLevel = 'bairro' | 'cidade' | 'federal';

export interface FeedTab {
  id: FeedLevel;
  label: string;
}

export const FEED_TABS: FeedTab[] = [
  { id: 'bairro', label: 'Meu Bairro' },
  { id: 'cidade', label: 'Minha Cidade' },
  { id: 'federal', label: 'Brasil Federal' },
];

export type FeedItem =
  | { type: 'pauta_ia'; data: import('./database').PautaIA }
  | { type: 'post_comunidade'; data: import('./database').PostComunidade };

