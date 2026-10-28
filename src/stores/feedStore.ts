'use client';

import { create } from 'zustand';
import { FeedLevel } from '@/types/feed';
import { PautaIA, PostComunidade } from '@/types/database';

export const INITIAL_PAUTA: PautaIA = {
  id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  cep_alvo: '04266-000',
  bairro_alvo: 'Ipiranga',
  cidade_alvo: 'São Paulo',
  estado_alvo: 'SP',
  titulo: 'ALERTA DE IA: Pauta na Câmara',
  resumo_ia: 'Votação amanhã sobre o novo Plano de Zoneamento da Rua Silva Bueno (R$ 5M).',
  impacto_bairro: 'Potencial aumento de tráfego e novas áreas comerciais.',
  vereador_proponente: 'Carlos Silva',
  link_pdf_original: 'https://diariooficial.saopaulo.sp.leg.br/exemplo-pauta-123.pdf',
  fonte_diario: 'Diário Oficial da Cidade de São Paulo - Ed. 248',
  votos_concordar: 142,
  votos_discordar: 38,
  status: 'ativa',
  data_votacao: new Date(Date.now() + 86400000).toISOString(),
  created_at: new Date().toISOString(),
};

export const INITIAL_POSTS: PostComunidade[] = [
  {
    id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    user: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      phone: '11987654321',
      email: 'maria.silva@exemplo.com',
      nome_completo: 'Maria Silva',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
      cep: '04266-000',
      bairro: 'Ipiranga',
      cidade: 'São Paulo',
      estado: 'SP',
      coordenadas: null,
      nivel_verificacao: 2,
      cpf_hash: null,
      created_at: new Date().toISOString(),
    },
    foto_url: 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=800&q=80',
    descricao: 'Gente, esse buraco na Rua Agostinho Gomes está enorme! Já protocolado na Prefeitura (nº 12345). #ZeladoriaUrbana #ipiranga',
    cep: '04266-000',
    bairro: 'Ipiranga',
    categoria: 'buraco',
    numero_protocolo: '12345',
    curtidas: 31,
    created_at: new Date().toISOString(),
  },
];

interface FeedStore {
  activeTab: FeedLevel;
  pautas: PautaIA[];
  posts: PostComunidade[];
  setActiveTab: (tab: FeedLevel) => void;
  votarPauta: (pautaId: string, opcao: 'concordar' | 'discordar') => void;
  curtirPost: (postId: string) => void;
  adicionarPost: (post: PostComunidade) => void;
}

export const useFeedStore = create<FeedStore>((set) => ({
  activeTab: 'bairro',
  pautas: [INITIAL_PAUTA],
  posts: INITIAL_POSTS,
  setActiveTab: (tab) => set({ activeTab: tab }),
  votarPauta: (pautaId, opcao) => {
    set((state) => ({
      pautas: state.pautas.map((p) => {
        if (p.id !== pautaId) return p;
        return {
          ...p,
          votos_concordar: opcao === 'concordar' ? p.votos_concordar + 1 : p.votos_concordar,
          votos_discordar: opcao === 'discordar' ? p.votos_discordar + 1 : p.votos_discordar,
        };
      }),
    }));
  },
  curtirPost: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, curtidas: post.curtidas + 1 } : post
      ),
    }));
  },
  adicionarPost: (post) => {
    set((state) => ({ posts: [post, ...state.posts] }));
  },
}));

