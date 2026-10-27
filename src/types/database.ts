// ============================================================
// Connecta — Tipos do Banco de Dados (espelha schema.sql)
// ============================================================

export type NivelVerificacao = 0 | 1 | 2;
// 0 = Visitante (não autenticado)
// 1 = Cadastrado (email + telefone + CEP)
// 2 = Cidadão Verificado (comprovante de residência / selfie)

export type OpcaoVoto = 'concordar' | 'discordar';

export type StatusPauta = 'ativa' | 'encerrada' | 'peticao_gerada';

export type CategoriaComunidade =
  | 'buraco'
  | 'iluminacao'
  | 'lixo'
  | 'alagamento'
  | 'transporte'
  | 'seguranca'
  | 'saude'
  | 'educacao'
  | 'outro';

export type StatusPeticao = 'rascunho' | 'aberta' | 'entregue' | 'respondida';

export interface User {
  id: string;
  phone: string | null;
  email: string;
  nome_completo: string;
  avatar_url: string | null;
  cep: string;
  bairro: string;
  cidade: string;
  estado: string;
  coordenadas: { lat: number; lng: number } | null;
  nivel_verificacao: NivelVerificacao;
  cpf_hash: string | null;
  created_at: string;
}

export interface PautaIA {
  id: string;
  cep_alvo: string;
  bairro_alvo: string;
  cidade_alvo: string;
  estado_alvo: string;
  titulo: string;
  resumo_ia: string;
  impacto_bairro: string;
  vereador_proponente: string;
  link_pdf_original: string | null;
  fonte_diario: string | null;
  votos_concordar: number;
  votos_discordar: number;
  status: StatusPauta;
  data_votacao: string | null;
  created_at: string;
}

export interface PostComunidade {
  id: string;
  user_id: string;
  user?: User;
  foto_url: string | null;
  descricao: string;
  cep: string;
  bairro: string;
  categoria: CategoriaComunidade;
  numero_protocolo: string;
  curtidas: number;
  created_at: string;
}

export interface VotoPauta {
  id: string;
  pauta_id: string;
  user_id: string;
  opcao_voto: OpcaoVoto;
  motivo_discordancia: string | null;
  created_at: string;
}

export interface Comentario {
  id: string;
  post_id: string;
  user_id: string;
  user?: User;
  conteudo: string;
  created_at: string;
}

export interface Peticao {
  id: string;
  pauta_id: string;
  pauta?: PautaIA;
  cep_alvo: string;
  total_assinaturas: number;
  pdf_url: string | null;
  status: StatusPeticao;
  created_at: string;
}

