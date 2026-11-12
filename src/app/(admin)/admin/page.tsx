'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  Sliders,
  FileText,
  Trash2,
  RefreshCw,
  Key,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Store,
  Clock,
  ArrowRight,
  Download,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PautaIASummarized, SYSTEM_SUMMARIZER_PROMPT } from '@/prompts/summarizer';
import { PautaIA } from '@/types/database';
import { EdicaoSJC } from '@/app/api/diario/sjc/route';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'diario_api' | 'publicadas' | 'config'>('diario_api');

  // Estado da API do Diário Oficial de SJC
  const [edicoesSJC, setEdicoesSJC] = useState<EdicaoSJC[]>([]);
  const [loadingEdicoes, setLoadingEdicoes] = useState(false);
  const [edicaoSelecionada, setEdicaoSelecionada] = useState<EdicaoSJC | null>(null);

  // Configurações da IA
  const [apiKey, setApiKey] = useState('');
  const [customPrompt, setCustomPrompt] = useState(SYSTEM_SUMMARIZER_PROMPT);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Estados de Processamento e Publicação
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  // Rascunho da pauta para revisão
  const [pautaRascunho, setPautaRascunho] = useState<PautaIASummarized | null>(null);

  // Lista de pautas publicadas
  const [pautasPublicadas, setPautasPublicadas] = useState<PautaIA[]>([]);
  const [loadingPautas, setLoadingPautas] = useState(false);

  // Carrega chave salva
  useEffect(() => {
    const savedKey = localStorage.getItem('connecta_gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    const savedPrompt = localStorage.getItem('connecta_system_prompt');
    if (savedPrompt) setCustomPrompt(savedPrompt);

    // Carrega edições da API de SJC na inicialização
    carregarEdicoesDiario();
  }, []);

  // 1. Busca as edições do Diário Oficial de SJC diretamente da API
  const carregarEdicoesDiario = async () => {
    setLoadingEdicoes(true);
    try {
      const res = await fetch('/api/diario/sjc');
      if (res.ok) {
        const data = await res.json();
        setEdicoesSJC(data.edicoes || []);
      }
    } catch (err) {
      console.warn('Erro ao carregar edições de SJC:', err);
    } finally {
      setLoadingEdicoes(false);
    }
  };

  // 2. Busca pautas já publicadas
  const carregarPautas = async () => {
    setLoadingPautas(true);
    try {
      const res = await fetch('/api/pautas?cidade=São José dos Campos');
      if (res.ok) {
        const data = await res.json();
        setPautasPublicadas(data.pautas || []);
      }
    } catch (err) {
      console.warn('Erro ao carregar pautas:', err);
    } finally {
      setLoadingPautas(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'publicadas') {
      carregarPautas();
    }
  }, [activeTab]);

  // Salvar configurações da IA
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('connecta_gemini_api_key', apiKey.trim());
    localStorage.setItem('connecta_system_prompt', customPrompt.trim());
    setStatusMessage('Configurações da IA salvas com sucesso!');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 3. AÇÃO PRINCIPAL: Processar publicação oficial com a IA
  const handleProcessarEdicaoComIA = async (edicao: EdicaoSJC) => {
    setEdicaoSelecionada(edicao);
    setIsProcessing(true);
    setPublishSuccess(null);
    setPautaRascunho(null);

    const textoParaIA = `
ATO OFICIAL: ${edicao.titulo_destaque}
SECRETARIA: ${edicao.secretaria}
BAIRRO: ${edicao.bairro_sugerido}
EDIÇÃO DO DIÁRIO DE SJC: Nº ${edicao.numero} (${edicao.data})
CONTEÚDO PUBLICADO: ${edicao.texto_resumo}
    `.trim();

    try {
      const res = await fetch('/api/ia/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto_bruto: textoParaIA,
          municipio: 'São José dos Campos',
          estado: 'SP',
          fonte_nome: `Diário Oficial de SJC nº ${edicao.numero} (${edicao.data})`,
          apiKey: apiKey || undefined,
          customPrompt: customPrompt !== SYSTEM_SUMMARIZER_PROMPT ? customPrompt : undefined,
        }),
      });

      if (!res.ok) throw new Error('Falha ao processar matéria com a IA');

      const data = await res.json();
      if (data.pauta) {
        setPautaRascunho({
          ...data.pauta,
          bairro_alvo: edicao.bairro_sugerido || data.pauta.bairro_alvo,
        });
      }
    } catch (err: any) {
      alert(`Erro no processamento da IA: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. APROVAÇÃO FINAL: Publicar no feed dos moradores de SJC
  const handleAprovarEPublicar = async () => {
    if (!pautaRascunho) return;

    setIsPublishing(true);
    try {
      const res = await fetch('/api/pautas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: pautaRascunho.titulo,
          resumo_ia: pautaRascunho.resumo_ia,
          impacto_bairro: pautaRascunho.impacto_bairro,
          vereador_proponente: pautaRascunho.vereador_proponente,
          bairro_alvo: pautaRascunho.bairro_alvo,
          cidade_alvo: 'São José dos Campos',
          estado_alvo: 'SP',
          cep_alvo: '12246-021',
          link_pdf_original: edicaoSelecionada?.pdf_url || null,
          fonte_diario: edicaoSelecionada ? `Diário Oficial de SJC nº ${edicaoSelecionada.numero}` : 'Diário Oficial de SJC',
          status: 'ativa',
        }),
      });

      if (!res.ok) throw new Error('Falha ao gravar pauta no banco de dados');

      const data = await res.json();
      setPublishSuccess(`✅ Pauta aprovada e publicada com sucesso no feed de São José dos Campos!`);
      setPautaRascunho(null);
      setEdicaoSelecionada(null);
    } catch (err: any) {
      alert(`Erro ao aprovar pauta: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Excluir pauta
  const handleExcluirPauta = async (id: string) => {
    if (!confirm('Deseja realmente remover esta pauta do ar?')) return;
    try {
      await fetch(`/api/pautas?id=${id}`, { method: 'DELETE' });
      setPautasPublicadas((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('Erro ao excluir pauta');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Barra de Status da API */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
              API do Diário Oficial de São José dos Campos Conectada
            </h2>
            <p className="text-[11px] text-gray-500">
              Fonte oficial: <span className="font-mono text-emerald-700">diariodomunicipio.sjc.sp.gov.br</span>
            </p>
          </div>
        </div>

        <button
          onClick={carregarEdicoesDiario}
          disabled={loadingEdicoes}
          className="text-xs font-bold text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingEdicoes ? 'animate-spin' : ''}`} />
          <span>Atualizar Diários de SJC</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-2 sm:space-x-6">
        <button
          onClick={() => setActiveTab('diario_api')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'diario_api'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Diário Oficial de SJC (Ao Vivo)</span>
        </button>

        <button
          onClick={() => setActiveTab('publicadas')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'publicadas'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Pautas no Ar ({pautasPublicadas.length || '...'})</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'config'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>3. Chave da IA & Comandos</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: DIÁRIO OFICIAL DE SÃO JOSÉ DOS CAMPOS (AO VIVO)   */}
      {/* ======================================================== */}
      {activeTab === 'diario_api' && (
        <div className="space-y-6">
          {publishSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-950">{publishSuccess}</p>
                  <p className="text-[11px] text-emerald-700">A pauta já está aberta para votos dos moradores de SJC.</p>
                </div>
              </div>
              <Link
                href="/feed"
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <span>Ver no Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Modal / Área de Revisão e Aprovação da Pauta (Quando a IA processa) */}
          {pautaRascunho && (
            <div className="bg-emerald-50/70 border-2 border-emerald-500 rounded-3xl p-5 sm:p-6 shadow-md space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm sm:text-base font-black text-emerald-950">
                    A IA gerou a pauta. Você aprova a publicação?
                  </h3>
                </div>
                <button
                  onClick={() => setPautaRascunho(null)}
                  className="text-xs text-gray-500 hover:text-gray-900 font-bold"
                >
                  ✕ Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Lado Esquerdo: Edição do Texto gerado */}
                <div className="lg:col-span-7 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                      Título da Pauta:
                    </label>
                    <input
                      type="text"
                      value={pautaRascunho.titulo}
                      onChange={(e) => setPautaRascunho({ ...pautaRascunho, titulo: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-black text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                      Resumo Cidadão (Linguagem que o morador entende):
                    </label>
                    <textarea
                      rows={2}
                      value={pautaRascunho.resumo_ia}
                      onChange={(e) => setPautaRascunho({ ...pautaRascunho, resumo_ia: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                      Impacto Prático no Bairro:
                    </label>
                    <input
                      type="text"
                      value={pautaRascunho.impacto_bairro}
                      onChange={(e) => setPautaRascunho({ ...pautaRascunho, impacto_bairro: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                        Autor / Proponente:
                      </label>
                      <input
                        type="text"
                        value={pautaRascunho.vereador_proponente}
                        onChange={(e) => setPautaRascunho({ ...pautaRascunho, vereador_proponente: e.target.value })}
                        className="w-full p-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                        Bairro Vinculado:
                      </label>
                      <input
                        type="text"
                        value={pautaRascunho.bairro_alvo}
                        onChange={(e) => setPautaRascunho({ ...pautaRascunho, bairro_alvo: e.target.value })}
                        className="w-full p-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Prévia Visual idêntica ao celular */}
                <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      Como o morador verá no Feed:
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      São José dos Campos
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        🏛️
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 leading-none">
                          Meu Bairro: {pautaRascunho.bairro_alvo}
                        </h4>
                        <p className="text-[10px] text-gray-400">CEP a CEP - local</p>
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-gray-900 leading-tight">
                      {pautaRascunho.titulo}
                    </h4>

                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] space-y-1">
                      <p>
                        <strong className="text-emerald-700">RESUMO: </strong>
                        {pautaRascunho.resumo_ia}
                      </p>
                      <p className="text-gray-600">
                        <strong>Impacto: </strong>
                        {pautaRascunho.impacto_bairro}
                      </p>
                      <p className="text-gray-600">
                        <strong>Autor: </strong>
                        {pautaRascunho.vereador_proponente}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 opacity-80 pt-1">
                      <div className="py-1.5 rounded-full bg-[#1ea751] text-white text-[10px] font-black text-center">
                        CONCORDAR
                      </div>
                      <div className="py-1.5 rounded-full bg-[#2b2f32] text-white text-[10px] font-black text-center">
                        DISCORDAR
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação para você */}
                  <div className="pt-2 space-y-2">
                    <Button
                      variant="primary"
                      onClick={handleAprovarEPublicar}
                      isLoading={isPublishing}
                      className="w-full py-3 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-xs flex items-center justify-center space-x-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Aprovar e Liberar no Feed de SJC</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => setPautaRascunho(null)}
                      className="w-full py-1 text-center text-xs text-gray-500 hover:text-red-600 font-semibold"
                    >
                      Descartar rascunho
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LISTA DE PUBLICAÇÕES REAIS DA CIDADE (DO DIÁRIO DE SJC) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                <span>Últimas Publicações Oficiais Encontradas em São José dos Campos</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {edicoesSJC.length} edições disponíveis
                </span>
              </h3>
            </div>

            {loadingEdicoes ? (
              <div className="py-16 text-center text-xs text-gray-500 space-y-2 bg-white rounded-2xl border border-gray-200">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                <p className="font-bold">Consultando API oficial de São José dos Campos...</p>
              </div>
            ) : edicoesSJC.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-200">
                Nenhuma publicação encontrada no momento. Clique em &quot;Atualizar Diários de SJC&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {edicoesSJC.map((edicao) => (
                  <div
                    key={edicao.id}
                    className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-emerald-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-lg border border-gray-200">
                          Edição nº {edicao.numero} • {edicao.data}
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                          Bairro: {edicao.bairro_sugerido}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {edicao.secretaria}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-snug">
                        {edicao.titulo_destaque}
                      </h4>

                      <p className="text-xs text-gray-600 leading-relaxed">
                        {edicao.texto_resumo}
                      </p>

                      <div className="flex items-center space-x-3 pt-1">
                        <a
                          href={edicao.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-gray-500 hover:text-emerald-700 flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                          <span>Abrir PDF Oficial de SJC</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <Button
                        variant="primary"
                        onClick={() => handleProcessarEdicaoComIA(edicao)}
                        isLoading={isProcessing && edicaoSelecionada?.id === edicao.id}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center justify-center space-x-2 shadow-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Resumir com IA e Revisar</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: PAUTAS NO AR (PUBLICADAS & RECEBENDO VOTOS)       */}
      {/* ======================================================== */}
      {activeTab === 'publicadas' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900">
                Pautas no Ar em São José dos Campos
              </h3>
              <p className="text-xs text-gray-500">
                Acompanhamento dos votos dos moradores em cada pauta liberada.
              </p>
            </div>
            <button
              onClick={carregarPautas}
              className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loadingPautas ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingPautas ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Carregando pautas do banco de dados...
            </div>
          ) : pautasPublicadas.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Nenhuma pauta aprovada ainda. Vá na aba &quot;Diário Oficial de SJC&quot; para aprovar a primeira.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pautasPublicadas.map((pauta) => (
                <div key={pauta.id} className="py-3.5 flex items-start justify-between space-x-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {pauta.bairro_alvo || 'Geral'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {pauta.vereador_proponente}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 leading-snug">
                      {pauta.titulo}
                    </h4>
                    <p className="text-[11px] text-gray-600 line-clamp-2">
                      {pauta.resumo_ia}
                    </p>
                    <div className="flex items-center space-x-4 text-[11px] text-gray-500 pt-1 font-medium">
                      <span className="text-emerald-600 font-bold">
                        👍 {pauta.votos_concordar || 0} Concordam
                      </span>
                      <span className="text-red-600 font-bold">
                        👎 {pauta.votos_discordar || 0} Discordam
                      </span>
                      <span>Status: <strong className="text-gray-800">{pauta.status}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExcluirPauta(pauta.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remover do feed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 3: CHAVE DA IA & COMANDOS                            */}
      {/* ======================================================== */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-black text-gray-900">
              Configurações da Inteligência Artificial
            </h3>
            <p className="text-xs text-gray-500">
              Insira sua chave gratuita do Google Gemini e edite os comandos que ensinam a IA a resumir as leis de SJC.
            </p>
          </div>

          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold animate-fadeIn">
              {statusMessage}
            </div>
          )}

          {/* Chave de API */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Google Gemini API Key:</span>
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline text-[11px] flex items-center space-x-1"
              >
                <span>Obter chave gratuita no Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <Input
              type="password"
              placeholder="Cole sua chave AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-gray-400">
              Plano 100% gratuito (1.500 requisições/dia). Fica salva localmente no seu navegador.
            </p>
          </div>

          {/* Prompt de Sistema */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 block">
                Comando Mestre da IA (System Prompt):
              </label>
              <button
                type="button"
                onClick={() => setCustomPrompt(SYSTEM_SUMMARIZER_PROMPT)}
                className="text-[11px] text-gray-400 hover:text-gray-700 underline"
              >
                Restaurar Padrão
              </button>
            </div>
            <textarea
              rows={10}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
            />
          </div>

          <Button type="submit" variant="primary" className="py-3 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
            Salvar Configurações
          </Button>
        </form>
      )}
    </div>
  );
}
