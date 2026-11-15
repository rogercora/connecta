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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MinutaModal, MinutaData } from '@/components/acoes/MinutaModal';
import { CriarAbaixoAssinadoModal } from '@/components/acoes/CriarAbaixoAssinadoModal';
import { useAuthStore } from '@/stores/authStore';

interface CausaCivica extends MinutaData {
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

  const [causas, setCausas] = useState<CausaCivica[]>(CAUSAS_INICIAIS);
  const [minhasAssinaturas, setMinhasAssinaturas] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'todas' | 'prontas' | 'assinadas'>('todas');
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
    // Marca o criador como o apoiador nº 1
    handleAssinar(nova.id);
  };

  // Filtros de busca e tabs
  const causasFiltradas = causas.filter((c) => {
    const matchSearch =
      c.titulo.toLowerCase().includes(search.toLowerCase()) ||
      c.bairro.toLowerCase().includes(search.toLowerCase()) ||
      c.cidade.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === 'prontas') {
      return c.totalAssinaturas >= c.meta;
    }
    if (activeTab === 'assinadas') {
      return !!minhasAssinaturas[c.id];
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-950 tracking-tight leading-tight">
            Ações Cívicas & Petições
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Abaixo-assinados auditados por CEP em {user?.cidade || 'São José dos Campos'}
          </p>
        </div>

        <button
          onClick={() => setIsCriarOpen(true)}
          className="p-2 bg-crimson-600 hover:bg-crimson-700 active:scale-95 text-white rounded-full shadow-crimson-btn flex items-center justify-center transition-all cursor-pointer"
          title="Iniciar novo abaixo-assinado"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por bairro ou pauta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-crimson-600 focus:outline-none"
        />
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-100 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('todas')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            activeTab === 'todas'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Todas ({causas.length})
        </button>
        <button
          onClick={() => setActiveTab('prontas')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            activeTab === 'prontas'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Prontas ({causas.filter((c) => c.totalAssinaturas >= c.meta).length})
        </button>
        <button
          onClick={() => setActiveTab('assinadas')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            activeTab === 'assinadas'
              ? 'bg-white text-zinc-950 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Minhas ({Object.values(minhasAssinaturas).filter(Boolean).length})
        </button>
      </div>

      {/* Lista de Cards de Ações */}
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
              {/* Badge de Status da Ação */}
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
                    <span>{bateuMeta ? '🔥 Quórum Atingido' : 'Em Andamento'}</span>
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
                    {bateuMeta ? 'Meta Concluída!' : `Meta: ${causa.meta}`}
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
                  <span className="hidden sm:inline">Minuta</span>
                </button>
              </div>
            </article>
          );
        })}

        {causasFiltradas.length === 0 && (
          <div className="p-8 text-center bg-white border border-zinc-200 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-zinc-700">Nenhuma ação cívica encontrada.</p>
            <p className="text-[11px] text-zinc-500">
              Você pode iniciar um novo abaixo-assinado para a sua rua agora mesmo!
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

      {/* Banner Explicativo de Quórum */}
      <div className="p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-center space-y-1">
        <p className="text-xs font-bold text-zinc-800 flex items-center justify-center space-x-1">
          <ShieldCheck className="w-4 h-4 text-crimson-600" />
          <span>Como funciona a geração jurídica automática?</span>
        </p>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Quando moradores do mesmo bairro/CEP concordam ou discordam em massa de uma deliberação pública, a IA do ConectaBr redige a minuta formal e compila as assinaturas auditadas pronta para envio protocolar à Câmara.
        </p>
      </div>

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
