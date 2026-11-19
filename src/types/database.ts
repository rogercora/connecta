// ============================================================
// ConectaBr — Tipos do Banco de Dados (espelha schema.sql)
// ============================================================

export type NivelVerificacao = 0 | 1 | 2;
// 0 = Visitante (não autenticado)
// 1 = Cadastrado (email + telefone + CEP)
// 2 = Cidadão Verificado (comprovante de residência / selfie)

export type OpcaoVoto = 'concordar' | 'discordar';

export type StatusPauta = 'pendente_revisao' | 'ativa' | 'encerrada' | 'peticao_gerada';

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

export type StatusPeticao =
  | 'rascunho'
  | 'pendente_revisao'
  | 'aberta'
  | 'entregue'
  | 'respondida'
  | 'arquivada';

export type TipoPeticao = 'oposicao_ato' | 'comunitaria';

export type StatusCidade = 'ativa' | 'em_espera' | 'em_breve';

export interface CidadeConfig {
  id: string;
  codigo_ibge: string | null;
  nome: string;
  estado: string;
  status: StatusCidade;
  meta_usuarios: number;
  quorum_peticao: number;
  email_camara_padrao: string | null;
  email_ouvidoria_padrao: string | null;
  created_at: string;
}

export type UserRole = 'cidadao' | 'admin' | 'super_admin';

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
  codigo_ibge?: string | null;
  coordenadas: { lat: number; lng: number } | null;
  nivel_verificacao: NivelVerificacao;
  role?: UserRole;
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
  quorum_meta?: number | null;
  categoria?: string | null;
  edicao_diario?: string | null;
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
  cidade?: string;
  estado?: string;
  categoria: CategoriaComunidade;
  numero_protocolo: string;
  curtidas: number;
  moradores_afetados?: number;
  comentarios_count?: number;
  user_ja_apoiou?: boolean;
  user_ja_curtiu?: boolean;
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
  pauta_id: string | null;
  pauta?: PautaIA | null;
  tipo: TipoPeticao;
  titulo: string | null;
  resumo: string | null;
  minuta_texto: string | null;
  argumentos_moradores: string[];
  email_destino: string | null;
  vereador_alvo: string | null;
  bairro: string | null;
  cidade: string;
  estado: string;
  cep_alvo: string;
  meta_assinaturas: number;
  total_assinaturas: number;
  pdf_url: string | null;
  protocolo_digital: string | null;
  created_by?: string | null;
  aprovada_por?: string | null;
  aprovada_em?: string | null;
  enviada_em?: string | null;
  resposta_camara?: string | null;
  user_assinou?: boolean;
  status: StatusPeticao;
  created_at: string;
}

export interface AssinaturaPeticao {
  id: string;
  peticao_id: string;
  user_id: string;
  comentario: string | null;
  created_at: string;
}

