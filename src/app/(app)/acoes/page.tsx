'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileSignature,
  Search,
  Plus,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  Landmark,
  FileText,
  Sparkles,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { MinutaModal, MinutaData } from '@/components/acoes/MinutaModal';
import { CriarAbaixoAssinadoModal } from '@/components/acoes/CriarAbaixoAssinadoModal';
import { PautaIACard } from '@/components/feed/PautaIACard';
import { usePautas, useCidadeStatus } from '@/hooks/useFeedReal';
import { useAuthStore } from '@/stores/authStore';
import { Peticao } from '@/types/database';

function buildMinutaFromPeticao(p: Peticao): MinutaData {
  const args = Array.isArray(p.argumentos_moradores) && p.argumentos_moradores.length > 0
    ? p.argumentos_moradores
    : [
        p.resumo ||
          p.pauta?.impacto_bairro ||
          'Manifestação cívica formal amparada no Art. 5º, XXXIV, "a" da CF/88.',
      ];

  return {
    id: p.id,
    titulo: p.titulo || p.pauta?.titulo || 'Petição Cívica ConectaBr',
    resumo:
      p.minuta_texto ||
      p.resumo ||
      p.pauta?.resumo_ia ||
      'Solicitação formal dos cidadãos ao Poder Legislativo Municipal.',
    bairro: p.bairro || p.pauta?.bairro_alvo || 'Centro',
    cidade: p.cidade || 'São José dos Campos',
    estado: p.estado || 'SP',
    vereadorAlvo: p.vereador_alvo || p.pauta?.vereador_proponente || 'Câmara Municipal',
    totalAssinaturas: Number(p.total_assinaturas) || 0,
    meta: Number(p.meta_assinaturas) || 50,
    tipoConsenso: p.tipo === 'oposicao_ato' ? 'discordar' : 'comunitario',
    dataCriacao: new Date(p.created_at || Date.now()).toLocaleDateString('pt-BR'),
    protocoloReferencia: p.protocolo_digital || `CBR-${p.id.slice(0, 6).toUpperCase()}`,
    justificativas: args,
  };
}

export default function AcoesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const userCidade = user?.cidade || 'São José dos Campos';
  const userEstado = user?.estado || 'SP';
  const userBairro = user?.bairro || 'Jardim Aquárius';

  const [mainTab, setMainTab] = useState<'atos' | 'peticoes'>('atos');
  const [subTabPeticoes, setSubTabPeticoes] = useState<'todas' | 'prontas' | 'assinadas'>('todas');
  const [search, setSearch] = useState('');
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);

  const [minutaSelecionada, setMinutaSelecionada] = useState<MinutaData | null>(null);
  const [isMinutaOpen, setIsMinutaOpen] = useState(false);
  const [isCriarOpen, setIsCriarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'peticoes') {
        setMainTab('peticoes');
      }
    }
  }, []);

  const { data: cidadeStatus } = useCidadeStatus(userCidade, userEstado);
  const { data: pautas = [], isLoading: loadingPautas } = usePautas('cidade', userCidade, userBairro);

  const {
    data: peticoesPayload,
    isLoading: loadingPeticoes,
    refetch: refetchPeticoes,
  } = useQuery({
    queryKey: ['peticoes_oficiais', userCidade, userEstado, isAuthenticated],
    queryFn: async () => {
      const res = await fetch(
        `/api/peticoes?cidade=${encodeURIComponent(userCidade)}&estado=${encodeURIComponent(userEstado)}`
      );
      if (!res.ok) {
        throw new Error('Falha ao carregar petições.');
      }
      return (await res.json()) as { peticoes: Peticao[]; quorumCidade: number };
    },
    staleTime: 1000 * 30,
  });

  const peticoes = peticoesPayload?.peticoes ?? [];
  const quorumCidade = cidadeStatus?.quorum_peticao ?? peticoesPayload?.quorumCidade ?? 50;

  const filteredPeticoes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return peticoes.filter((p) => {
      if (subTabPeticoes === 'assinadas' && !p.user_assinou) return false;
      if (
        subTabPeticoes === 'prontas' &&
        p.status !== 'entregue' &&
        p.status !== 'respondida' &&
        (p.total_assinaturas || 0) < (p.meta_assinaturas || quorumCidade)
      ) {
        return false;
      }
      if (!q) return true;
      const hay = `${p.titulo || ''} ${p.resumo || ''} ${p.bairro || ''} ${p.vereador_alvo || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [peticoes, search, subTabPeticoes, quorumCidade]);

  const handleAssinar = async (peticaoId: string) => {
    setSignError(null);
    if (!isAuthenticated) {
      setSignError('Entre com sua conta para registrar sua assinatura única.');
      return;
    }

    setSigningId(peticaoId);
    try {
      const res = await fetch('/api/peticoes/assinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peticao_id: peticaoId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSignError(data.error || 'Não foi possível registrar sua assinatura.');
        return;
      }

      queryClient.setQueryData(
        ['peticoes_oficiais', userCidade, userEstado, isAuthenticated],
        (old: { peticoes: Peticao[]; quorumCidade: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            peticoes: old.peticoes.map((item) =>
              item.id === peticaoId
                ? {
                    ...item,
                    user_assinou: Boolean(data.assinado),
                    total_assinaturas: Number(data.total_assinaturas ?? item.total_assinaturas),
                  }
                : item
            ),
          };
        }
      );
    } catch {
      setSignError('Erro de rede ao assinar petição.');
    } finally {
      setSigningId(null);
    }
  };

  const handleNovaPeticaoCriada = () => {
    setMainTab('peticoes');
    setCreatedNotice(
      '✅ Sua proposta foi enviada para análise rápida da moderação! Ela já aparece abaixo para você acompanhar.'
    );
    void refetchPeticoes();
  };

  return (
    <div className="max-w-md mx-auto pb-24 min-h-screen bg-zinc-50">
      {/* Banner Topo Cívico */}
      <div className="bg-white border-b border-zinc-200 px-4 pt-4 pb-3 space-y-3 sticky top-14 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-zinc-950 tracking-tight flex items-center space-x-1.5">
              <Landmark className="w-4 h-4 text-crimson-600" />
              <span>Ações &amp; Câmara</span>
            </h1>
            <p className="text-[11px] text-zinc-500 font-medium">
              {userCidade}/{userEstado} • Quórum de petição: {quorumCidade} votos
            </p>
          </div>

          {mainTab === 'peticoes' && (
            <button
              onClick={() => setIsCriarOpen(true)}
              className="py-1.5 px-3 rounded-full bg-crimson-600 hover:bg-crimson-700 text-white text-xs font-bold flex items-center space-x-1 shadow-crimson-btn transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Propor</span>
            </button>
          )}
        </div>

        {/* Seletor Principal: Decisões da Câmara vs Petições Oficiais */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-2xl border border-zinc-200/80">
          <button
            onClick={() => setMainTab('atos')}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              mainTab === 'atos'
                ? 'bg-white text-crimson-700 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Decisões da Câmara ({pautas.length})
          </button>
          <button
            onClick={() => setMainTab('peticoes')}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              mainTab === 'peticoes'
                ? 'bg-white text-crimson-700 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Petições Oficiais ({peticoes.length})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: DECISÕES DA CÂMARA (PAUTAS COM IA)                */}
      {/* ======================================================== */}
      {mainTab === 'atos' && (
        <div>
          <div className="px-4 py-2.5 bg-crimson-50/70 border-b border-crimson-100 text-[11px] text-crimson-950 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-crimson-600 shrink-0" />
            <span>
              Projetos e contratos traduzidos por IA. Ao atingir <strong>{quorumCidade} discordâncias</strong> na cidade, vira petição oficial para revisão no Admin.
            </span>
          </div>

          {loadingPautas ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-crimson-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Carregando atos oficiais de {userCidade}...</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 bg-white">
              {pautas.map((pauta) => (
                <PautaIACard key={pauta.id} pauta={pauta} cidadeQuorum={quorumCidade} />
              ))}

              {pautas.length === 0 && (
                <div className="p-8 text-center text-xs text-zinc-400">
                  Nenhuma deliberação da Câmara aguardando votação para {userCidade}.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: PETIÇÕES OFICIAIS (SUPABASE REAL)                 */}
      {/* ======================================================== */}
      {mainTab === 'peticoes' && (
        <div className="p-4 space-y-4">
          {createdNotice && (
            <div className="p-3 bg-crimson-50 border border-crimson-200 rounded-2xl text-xs font-bold text-crimson-900">
              {createdNotice}
            </div>
          )}

          {signError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{signError}</span>
              </div>
              {!isAuthenticated && (
                <Link href="/login?next=/acoes?tab=peticoes" className="font-bold text-crimson-700 underline shrink-0">
                  Entrar
                </Link>
              )}
            </div>
          )}

          {/* Busca + Sub-filtros */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar petição por tema, bairro ou vereador..."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-200 rounded-2xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-crimson-600"
              />
            </div>

            <div className="flex items-center space-x-2">
              {[
                { key: 'todas', label: 'Todas' },
                { key: 'prontas', label: 'Quórum / Protocoladas' },
                { key: 'assinadas', label: 'Assinadas por mim' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSubTabPeticoes(t.key as any)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                    subTabPeticoes === t.key
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loadingPeticoes ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-crimson-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Carregando petições oficiais...</span>
            </div>
          ) : filteredPeticoes.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 text-center space-y-3">
              <FileSignature className="w-8 h-8 text-crimson-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-950">Nenhuma petição publicada neste filtro</h3>
                <p className="text-xs text-zinc-500">
                  Vote em &ldquo;Decisões da Câmara&rdquo; ou crie agora uma petição comunitária para mobilizar os vizinhos.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsCriarOpen(true)}
                className="py-2.5 px-5 rounded-full text-xs font-bold bg-crimson-600 hover:bg-crimson-700 text-white"
              >
                + Propor Abaixo-Assinado
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPeticoes.map((peticao) => {
                const meta = Math.max(1, Number(peticao.meta_assinaturas) || quorumCidade);
                const assinaturas = Number(peticao.total_assinaturas) || 0;
                const pct = Math.min(100, Math.round((assinaturas / meta) * 100));
                const isEmRevisao = peticao.status === 'pendente_revisao' || peticao.status === 'rascunho';
                const isEntregue = peticao.status === 'entregue' || peticao.status === 'respondida';
                const tituloDisplay = peticao.titulo || peticao.pauta?.titulo || 'Petição Cívica';
                const resumoDisplay =
                  peticao.resumo || peticao.pauta?.impacto_bairro || 'Solicitação oficial encaminhada à Câmara.';

                return (
                  <article
                    key={peticao.id}
                    className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          isEmRevisao
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isEntregue
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-crimson-50 text-crimson-800 border-crimson-200'
                        }`}
                      >
                        {isEmRevisao
                          ? '⏳ Em Revisão no Admin'
                          : peticao.status === 'respondida'
                          ? '🏛️ Respondida pela Câmara'
                          : isEntregue
                          ? '📨 Protocolada na Câmara'
                          : '✍️ Coleta Aberta'}
                      </span>

                      <span className="text-[11px] font-semibold text-zinc-400">
                        {peticao.bairro || 'Geral'} • {peticao.cidade}/{peticao.estado}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-zinc-950 leading-snug">{tituloDisplay}</h3>
                      <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">{resumoDisplay}</p>
                      <p className="text-[11px] font-bold text-crimson-700">
                        Destinatário: {peticao.vereador_alvo || peticao.pauta?.vereador_proponente || 'Câmara Municipal'}
                      </p>
                    </div>

                    {/* Progresso de assinaturas */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-zinc-900 flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-crimson-600" />
                          <span>{assinaturas} assinaturas únicas</span>
                        </span>
                        <span className="text-zinc-500">
                          Meta: {meta} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isEntregue ? 'bg-emerald-500' : 'bg-crimson-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {peticao.resposta_camara && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950">
                        <strong>Resposta Institucional:</strong> {peticao.resposta_camara}
                      </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {peticao.status === 'aberta' ? (
                        <Button
                          type="button"
                          variant={peticao.user_assinou ? 'outline' : 'primary'}
                          isLoading={signingId === peticao.id}
                          onClick={() => void handleAssinar(peticao.id)}
                          className={`flex-1 py-2 px-3 rounded-full text-xs font-bold ${
                            peticao.user_assinou
                              ? 'border-crimson-600 text-crimson-700 bg-crimson-50'
                              : 'bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson-btn'
                          }`}
                        >
                          {peticao.user_assinou ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              <span>Assinado por você</span>
                            </>
                          ) : (
                            <>
                              <FileSignature className="w-3.5 h-3.5 mr-1" />
                              <span>Assinar Petição</span>
                            </>
                          )}
                        </Button>
                      ) : isEmRevisao ? (
                        <span className="flex-1 py-2 px-3 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold text-center flex items-center justify-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Aguardando aprovação para abrir coleta</span>
                        </span>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => {
                          setMinutaSelecionada(buildMinutaFromPeticao(peticao));
                          setIsMinutaOpen(true);
                        }}
                        className="py-2 px-3 rounded-full border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 flex items-center space-x-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Minuta</span>
                      </button>

                      {!isEmRevisao && (
                        <a
                          href={`/api/peticao/gerar-pdf?peticao_id=${peticao.id}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="py-2 px-3 rounded-full border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      )}
                    </div>

                    {peticao.pauta?.link_pdf_original && (
                      <a
                        href={peticao.pauta.link_pdf_original}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-zinc-500 hover:text-crimson-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Ver ato original no Diário Oficial</span>
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Minuta Formal / Imprimir PDF */}
      <MinutaModal
        isOpen={isMinutaOpen}
        onClose={() => setIsMinutaOpen(false)}
        data={minutaSelecionada}
      />

      {/* Modal de Criação de Causa */}
      <CriarAbaixoAssinadoModal
        isOpen={isCriarOpen}
        onClose={() => setIsCriarOpen(false)}
        onCreated={handleNovaPeticaoCriada}
        quorumCidade={quorumCidade}
      />
    </div>
  );
}
