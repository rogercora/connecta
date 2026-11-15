'use client';

import React, { useState, useEffect } from 'react';
import {
  Hand,
  FileText,
  CheckCircle2,
  Share2,
  Users,
  Plus,
  Sparkles,
  ShieldCheck,
  Search,
  Check,
  Megaphone,
  Landmark,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MinutaModal, MinutaData } from '@/components/acoes/MinutaModal';
import { CriarAbaixoAssinadoModal } from '@/components/acoes/CriarAbaixoAssinadoModal';
import { PautaIACard } from '@/components/feed/PautaIACard';
import { usePautas } from '@/hooks/useFeedReal';
import { useAuthStore } from '@/stores/authStore';

export interface CausaCivica extends MinutaData {
  categoria: 'zoneamento' | 'zeladoria' | 'gastos' | 'transporte' | 'seguranca';
  destaque?: boolean;
}

const CAUSAS_INICIAIS: CausaCivica[] = [
  {
    id: 'causa-sjc-cassiano',
    titulo: 'Revisão do Plano Viário e Faixas Exclusivas na Av. Cassiano Ricardo',
    bairro: 'Jardim Aquárius',
    cidade: 'São José dos Campos',
    estado: 'SP',
    totalAssinaturas: 142,
    meta: 200,
    tipoConsenso: 'discordar',
    categoria: 'transporte',
    destaque: true,
    protocoloReferencia: 'SJC-LEG-2026-042',
    vereadorAlvo: 'Marcio Roberto',
    resumo:
      'Originada do consenso de 142 votos de moradores do Jardim Aquárius na pauta de alteração viária e estacionamentos da Câmara Municipal de São José dos Campos. Os moradores reivindicam a manutenção das faixas de acesso e recuo seguro para pedestres.',
    justificativas: [
      'Gargalo severo no trânsito durante horários de pico entre 17h30 e 19h30.',
      'Ausência de estudo prévio de impacto de tráfego apresentado aos moradores locais.',
      'Comprometimento do acesso de ambulâncias e serviços emergenciais.',
    ],
    dataCriacao: '10/11/2026',
  },
  {
    id: 'causa-sjc-taxas',
    titulo: 'Rejeição ao Reajuste Extraordinário de Taxas de Resíduos Noturnos',
    bairro: 'Centro',
    cidade: 'São José dos Campos',
    estado: 'SP',
    totalAssinaturas: 268,
    meta: 250,
    tipoConsenso: 'discordar',
    categoria: 'gastos',
    destaque: false,
    protocoloReferencia: 'SJC-LEG-2026-019',
    vereadorAlvo: 'Comissão de Economia e Finanças',
    resumo:
      'Mobilização de comerciantes e moradores da região central para suspensão do edital de cobrança de taxa de recolhimento especial após as 22h sem audiência pública participativa.',
    justificativas: [
      'Bitributação em relação ao IPTU já recolhido para zeladoria urbana.',
      'Falta de cronograma transparente de implementação das rotas.',
    ],
    dataCriacao: '05/11/2026',
  },
  {
    id: 'causa-sjc-linha-verde',
    titulo: 'Fiscalização e Recapeamento Asfáltico com Drenagem na Linha Verde',
    bairro: 'Zona Sul',
    cidade: 'São José dos Campos',
    estado: 'SP',
    totalAssinaturas: 89,
    meta: 100,
    tipoConsenso: 'comunitario',
    categoria: 'zeladoria',
    destaque: false,
    protocoloReferencia: 'SJC-ZEL-2026-118',
    resumo:
      'Solicitação formal de vistoria na pavimentação e escoamento pluvial dos trechos da Linha Verde que sofrem com acúmulo de água e desgaste após períodos de fortes chuvas.',
    justificativas: [
      'Risco constante de aquaplanagem de motociclistas e veículos.',
      'Bueiros sem limpeza regular há mais de 4 meses segundo os vizinhos.',
    ],
    dataCriacao: '12/11/2026',
  },
];

export default function AcoesPage() {
  const user = useAuthStore((s) => s.user);
  const userCidade = user?.cidade || 'São José dos Campos';
  const userBairro = user?.bairro || 'Jardim Aquárius';

  // 1. Aba Principal: 'atos' (Decisões da Câmara) ou 'peticoes' (Abaixo-Assinados com Quórum)
  const [mainTab, setMainTab] = useState<'atos' | 'peticoes'>('atos');

  // Busca as pautas reais do Diário Oficial
  const { data: pautas = [], isLoading: loadingPautas } = usePautas('cidade', userCidade, userBairro);

  // Estados das Petições
  const [causas, setCausas] = useState<CausaCivica[]>(CAUSAS_INICIAIS);
  const [minhasAssinaturas, setMinhasAssinaturas] = useState<Record<string, boolean>>({});
  const [subTabPeticoes, setSubTabPeticoes] = useState<'todas' | 'prontas' | 'assinadas'>('todas');
  const [search, setSearch] = useState('');

  // Modais
  const [minutaSelecionada, setMinutaSelecionada] = useState<MinutaData | null>(null);
  const [isMinutaOpen, setIsMinutaOpen] = useState(false);
  const [isCriarOpen, setIsCriarOpen] = useState(false);

  // Carrega assinaturas salvas do localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('conectabr_user_petitions');
      if (saved) {
        setMinhasAssinaturas(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Erro ao carregar assinaturas:', e);
    }
  }, []);

  const handleAssinar = (causaId: string) => {
    const jaAssinou = !!minhasAssinaturas[causaId];
    const novoEstado = !jaAssinou;

    setMinhasAssinaturas((prev) => {
      const next = { ...prev, [causaId]: novoEstado };
      if (typeof window !== 'undefined') {
        localStorage.setItem('conectabr_user_petitions', JSON.stringify(next));
      }
      return next;
    });

    setCausas((prev) =>
      prev.map((c) => {
        if (c.id !== causaId) return c;
        const diff = novoEstado ? 1 : -1;
        return {
          ...c,
          totalAssinaturas: Math.max(1, c.totalAssinaturas + diff),
        };
      })
    );
  };

  const handleOpenMinuta = (causa: CausaCivica) => {
    setMinutaSelecionada(causa);
    setIsMinutaOpen(true);
  };

  const handleNovaCausaCreated = (novaCausa: {
    titulo: string;
    bairro: string;
    cidade: string;
    estado: string;
    meta: number;
    resumo: string;
  }) => {
    const nova: CausaCivica = {
      id: `causa-custom-${Date.now()}`,
      titulo: novaCausa.titulo,
      bairro: novaCausa.bairro,
      cidade: novaCausa.cidade,
      estado: novaCausa.estado,
      totalAssinaturas: 1,
      meta: novaCausa.meta,
      tipoConsenso: 'comunitario',
      categoria: 'zeladoria',
      resumo: novaCausa.resumo,
      justificativas: ['Mobilização comunitária iniciada por moradores locais.'],
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      protocoloReferencia: `CBR-${novaCausa.cidade.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    };

    setCausas((prev) => [nova, ...prev]);
    handleAssinar(nova.id);
  };

  // Filtros de busca nas Petições
  const causasFiltradas = causas.filter((c) => {
    const matchSearch =
      c.titulo.toLowerCase().includes(search.toLowerCase()) ||
      c.bairro.toLowerCase().includes(search.toLowerCase()) ||
      c.cidade.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (subTabPeticoes === 'prontas') {
      return c.totalAssinaturas >= c.meta;
    }
    if (subTabPeticoes === 'assinadas') {
      return !!minhasAssinaturas[c.id];
    }
    return true;
  });

  return (
    <div className="w-full max-w-md mx-auto pb-24 space-y-4">
      {/* Cabeçalho da Central de Ações */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-950 tracking-tight leading-tight">
            Central Cívica & Ações
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Monitoramento de atos e petições de {userCidade}
          </p>
        </div>

        {mainTab === 'peticoes' && (
          <button
            onClick={() => setIsCriarOpen(true)}
            className="p-2 bg-crimson-600 hover:bg-crimson-700 active:scale-95 text-white rounded-full shadow-crimson-btn flex items-center justify-center transition-all cursor-pointer"
            title="Iniciar novo abaixo-assinado"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Seletor Principal de Abas */}
      <div className="px-4">
        <div className="flex bg-zinc-100 p-1 rounded-2xl text-xs font-black">
          <button
            onClick={() => setMainTab('atos')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              mainTab === 'atos'
                ? 'bg-white text-crimson-700 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Decisões da Câmara ({pautas.length})</span>
          </button>

          <button
            onClick={() => setMainTab('peticoes')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              mainTab === 'peticoes'
                ? 'bg-white text-crimson-700 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Petições Oficiais ({causas.length})</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 1: DECISÕES DA CÂMARA (ATOS OFICIAIS DO DIÁRIO OFICIAL)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainTab === 'atos' && (
        <div className="space-y-3">
          {/* Caixa de Regra Cívica */}
          <div className="mx-4 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-zinc-900 font-bold">
              <Megaphone className="w-4 h-4 text-crimson-600 shrink-0" />
              <span>Como funciona a votação das decisões:</span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              • <strong>Concordar:</strong> Registra apoio público ao ato ou licitação da Prefeitura/Câmara no banco de dados.<br />
              • <strong>Discordar:</strong> Registra o seu argumento e <strong>conta como 1 assinatura de oposição</strong>. Ao alcançar <strong>50 discordâncias</strong>, a IA redige a minuta formal do Abaixo-Assinado para envio protocolar à Câmara após revisão do administrador.
            </p>
          </div>

          {loadingPautas ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-crimson-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Carregando atos oficiais de {userCidade}...</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 bg-white">
              {pautas.map((pauta) => (
                <PautaIACard key={pauta.id} pauta={pauta} />
              ))}

              {pautas.length === 0 && (
                <div className="p-8 text-center text-xs text-zinc-400">
                  Nenhuma deliberação da Câmara aguardando votação para esta localidade.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 2: PETIÇÕES & ABAIXO-ASSINADOS COM QUÓRUM                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainTab === 'peticoes' && (
        <div className="px-4 space-y-4">
          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por causa, bairro ou tema..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-crimson-600 focus:outline-none"
            />
          </div>

          {/* Sub-tabs das Petições */}
          <div className="flex bg-zinc-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setSubTabPeticoes('todas')}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                subTabPeticoes === 'todas'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Todas ({causas.length})
            </button>
            <button
              onClick={() => setSubTabPeticoes('prontas')}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                subTabPeticoes === 'prontas'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Prontas ({causas.filter((c) => c.totalAssinaturas >= c.meta).length})
            </button>
            <button
              onClick={() => setSubTabPeticoes('assinadas')}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                subTabPeticoes === 'assinadas'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Assinadas ({Object.values(minhasAssinaturas).filter(Boolean).length})
            </button>
          </div>

          {/* Lista de Petições */}
          <div className="space-y-3.5">
            {causasFiltradas.map((causa) => {
              const assinado = !!minhasAssinaturas[causa.id];
              const pct = Math.min(100, Math.round((causa.totalAssinaturas / causa.meta) * 100));
              const bateuMeta = causa.totalAssinaturas >= causa.meta;

              return (
                <article
                  key={causa.id}
                  className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
                    bateuMeta ? 'border-crimson-300 ring-1 ring-crimson-200' : 'border-zinc-200'
                  }`}
                >
                  {/* Badge de Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          bateuMeta
                            ? 'bg-crimson-100 text-crimson-800 border border-crimson-200'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        <Hand className="w-3 h-3" />
                        <span>{bateuMeta ? '🔥 Quórum Atingido' : 'Em Mobilização'}</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-semibold">• {causa.bairro}</span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400">
                      {causa.protocoloReferencia || 'Oficial'}
                    </span>
                  </div>

                  {/* Título da Causa */}
                  <h3 className="font-extrabold text-sm text-zinc-950 leading-snug">
                    {causa.titulo}
                  </h3>

                  {/* Resumo */}
                  <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                    {causa.resumo}
                  </p>

                  {/* Termômetro de Assinaturas */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          bateuMeta
                            ? 'bg-crimson-600'
                            : 'bg-gradient-to-r from-crimson-500 to-crimson-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
                      <span className="font-bold text-zinc-800">
                        {causa.totalAssinaturas} assinaturas auditadas
                      </span>
                      <span className={bateuMeta ? 'font-bold text-crimson-700' : ''}>
                        {bateuMeta ? 'Meta Batida (Pronta para Protocolo)' : `Meta: ${causa.meta}`}
                      </span>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="pt-1 flex items-center space-x-2">
                    <button
                      onClick={() => handleAssinar(causa.id)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer ${
                        assinado
                          ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                          : 'bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson-btn'
                      }`}
                    >
                      {assinado ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Você assinou</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Assinar Digitalmente</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenMinuta(causa)}
                      className="py-2.5 px-3 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Ver minuta formal do abaixo-assinado"
                    >
                      <FileText className="w-4 h-4 text-crimson-600" />
                      <span className="hidden sm:inline">Minuta PDF</span>
                    </button>
                  </div>
                </article>
              );
            })}

            {causasFiltradas.length === 0 && (
              <div className="p-8 text-center bg-white border border-zinc-200 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-zinc-700">Nenhuma petição encontrada.</p>
                <p className="text-[11px] text-zinc-500">
                  Inicie um novo abaixo-assinado para a sua rua ou vote nas decisões da Câmara!
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsCriarOpen(true)}
                  className="mt-2 text-xs py-2 px-4 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson-btn"
                >
                  Criar Abaixo-Assinado
                </Button>
              </div>
            )}
          </div>

          {/* Dossiê Jurídico Constitucional */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-center space-y-1">
            <p className="text-xs font-bold text-zinc-800 flex items-center justify-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-crimson-600" />
              <span>Validade Jurídica (Art. 5º, XXXIV da Constituição Federal)</span>
            </p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Toda petição gerada pelo ConectaBr respeita o Direito de Petição aos Poderes Públicos em defesa de direitos ou contra ilegalidade ou abuso de poder.
            </p>
          </div>
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
        onCreated={handleNovaCausaCreated}
      />
    </div>
  );
}