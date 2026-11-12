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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PautaIASummarized, SYSTEM_SUMMARIZER_PROMPT } from '@/prompts/summarizer';
import { PautaIA } from '@/types/database';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'gerador' | 'publicadas' | 'config'>('gerador');

  // Configurações da IA
  const [apiKey, setApiKey] = useState('');
  const [customPrompt, setCustomPrompt] = useState(SYSTEM_SUMMARIZER_PROMPT);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Estados do Gerador de Pautas
  const [bairroAlvo, setBairroAlvo] = useState('Jardim Aquárius');
  const [textoBruto, setTextoBruto] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  // Rascunho gerado pela IA para revisão
  const [pautaRascunho, setPautaRascunho] = useState<PautaIASummarized | null>(null);
  const [fonteNome, setFonteNome] = useState('Diário Oficial de São José dos Campos');

  // Lista de pautas publicadas
  const [pautasPublicadas, setPautasPublicadas] = useState<PautaIA[]>([]);
  const [loadingPautas, setLoadingPautas] = useState(false);

  // Carrega chave salva no localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('connecta_gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    const savedPrompt = localStorage.getItem('connecta_system_prompt');
    if (savedPrompt) setCustomPrompt(savedPrompt);
  }, []);

  // Busca pautas publicadas
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

  // Salvar configurações
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('connecta_gemini_api_key', apiKey.trim());
    localStorage.setItem('connecta_system_prompt', customPrompt.trim());
    setStatusMessage('Configurações da IA e chave salvas com sucesso!');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Exemplos reais para testar com 1 clique
  const carregarExemplo = (tipo: 'zoneamento' | 'iptu' | 'transporte') => {
    if (tipo === 'zoneamento') {
      setBairroAlvo('Jardim Aquárius');
      setTextoBruto(
        `PROJETO DE LEI COMPLEMENTAR Nº 04/2026 - CÂMARA MUNICIPAL DE SÃO JOSÉ DOS CAMPOS
Autor: Vereador Carlos Silva
Ementa: Altera dispositivos da Lei de Zoneamento Urbano no perímetro do Jardim Aquárius, autorizando a implantação de edifícios de uso misto e comercial de médio e alto impacto na Avenida Cassiano Ricardo e vias adjacentes, mediante aplicação de outorga onerosa do direito de construir. Fica estabelecida a obrigatoriedade de apresentação prévia de Relatório de Impacto de Vizinhança (RIV).`
      );
    } else if (tipo === 'iptu') {
      setBairroAlvo('Bosque dos Eucaliptos');
      setTextoBruto(
        `DECRETO MUNICIPAL Nº 19.822/2026 - PREFEITURA DE SÃO JOSÉ DOS CAMPOS
Autor: Poder Executivo Municipal (Prefeito)
Assunto: Regulamenta a atualização da Planta Genérica de Valores (PGV) para fins de lançamento e cobrança do Imposto Predial e Territorial Urbano (IPTU) e da Taxa de Limpeza Pública no exercício de 2026, com foco especial nos loteamentos da Zona Sul (Bosque dos Eucaliptos, Jardim Satélite e Parque Industrial). Estimativa de reajuste entre 7,8% e 11,2% para imóveis com ampliações cadastrais recentes.`
      );
    } else {
      setBairroAlvo('Urbanova');
      setTextoBruto(
        `REQUERIMENTO LEGISLATIVO Nº 882/2026 - COMISSÃO DE TRANSPORTE E MOBILIDADE
Autor: Vereadora Juliana Mendes
Solicita à Secretaria de Mobilidade Urbana e ao Consórcio de Transporte Público a readequação de itinerários e a criação de linha expressa semi-direta ligando o bairro Urbanova (Avenida Shishima Hifumi) ao Terminal Central, reduzindo o tempo de deslocamento em horários de pico matutino e vespertino.`
      );
    }
  };

  // 1. Processar com a IA (Gera rascunho sem publicar)
  const handleProcessarIA = async () => {
    if (!textoBruto.trim()) {
      alert('Por favor, cole o texto da lei ou edital antes de processar.');
      return;
    }

    setIsProcessing(true);
    setPublishSuccess(null);

    try {
      const res = await fetch('/api/ia/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto_bruto: textoBruto,
          municipio: 'São José dos Campos',
          estado: 'SP',
          fonte_nome: fonteNome,
          apiKey: apiKey || undefined,
          customPrompt: customPrompt !== SYSTEM_SUMMARIZER_PROMPT ? customPrompt : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao processar texto com a IA');
      }

      const data = await res.json();
      if (data.pauta) {
        setPautaRascunho({
          ...data.pauta,
          bairro_alvo: bairroAlvo || data.pauta.bairro_alvo,
        });
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Aprovar e Publicar no Feed Real
  const handlePublicar = async () => {
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
          bairro_alvo: pautaRascunho.bairro_alvo || bairroAlvo,
          cidade_alvo: 'São José dos Campos',
          estado_alvo: 'SP',
          cep_alvo: '12246-021',
          fonte_diario: fonteNome,
          status: 'ativa',
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao publicar pauta no banco de dados');
      }

      const data = await res.json();
      setPublishSuccess(`Pauta publicada com sucesso no feed de São José dos Campos! (ID: ${data.pauta?.id || 'ok'})`);
      setPautaRascunho(null);
      setTextoBruto('');
    } catch (err: any) {
      alert(`Erro ao publicar: ${err.message}`);
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
    <div className="space-y-6">
      {/* Banner Superior Explicativo */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-300" />
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              Modo Semi-Automático: A IA resume, você aprova
            </h2>
          </div>
          <span className="text-[11px] bg-emerald-700/60 border border-emerald-400/30 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
            Curadoria Humana
          </span>
        </div>
        <p className="text-xs text-emerald-100/90 leading-relaxed max-w-3xl">
          Nenhuma pauta vai para os moradores sem a sua revisão. A inteligência artificial faz a leitura do Diário Oficial, traduz o juridiquês e calcula o impacto no bairro. Você confere a prévia e libera com 1 clique.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-1 sm:space-x-4">
        <button
          onClick={() => setActiveTab('gerador')}
          className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'gerador'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>1. Nova Pauta com IA</span>
        </button>

        <button
          onClick={() => setActiveTab('publicadas')}
          className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'publicadas'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>2. Pautas no Ar ({pautasPublicadas.length || '...'})</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'config'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>3. Comandos da IA & Chaves</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: GERADOR DE PAUTAS (SEMI-AUTOMÁTICO)               */}
      {/* ======================================================== */}
      {activeTab === 'gerador' && (
        <div className="space-y-6">
          {publishSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-950">{publishSuccess}</p>
                  <p className="text-[11px] text-emerald-700">A pauta já está disponível para votação dos cidadãos.</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna da Esquerda: Entrada do Texto */}
            <div className="lg:col-span-6 space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-900 block">
                  Texto da Lei / Diário Oficial de SJC
                </label>
                <div className="text-[11px] text-gray-500">
                  Cidade: <strong>São José dos Campos - SP</strong>
                </div>
              </div>

              {/* Botões de Exemplo Rápido */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  Testar com exemplos reais de SJC:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => carregarExemplo('zoneamento')}
                    className="py-1 px-2.5 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] font-medium border border-gray-200 transition-colors"
                  >
                    🏢 Zoneamento (Aquárius)
                  </button>
                  <button
                    type="button"
                    onClick={() => carregarExemplo('iptu')}
                    className="py-1 px-2.5 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] font-medium border border-gray-200 transition-colors"
                  >
                    💰 IPTU 2026 (Zona Sul)
                  </button>
                  <button
                    type="button"
                    onClick={() => carregarExemplo('transporte')}
                    className="py-1 px-2.5 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] font-medium border border-gray-200 transition-colors"
                  >
                    🚌 Ônibus Direto (Urbanova)
                  </button>
                </div>
              </div>

              {/* Bairro Alvo */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Bairro ou Região Mais Afetada:
                </label>
                <select
                  value={bairroAlvo}
                  onChange={(e) => setBairroAlvo(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Jardim Aquárius">Jardim Aquárius (Zona Oeste)</option>
                  <option value="Urbanova">Urbanova (Zona Oeste)</option>
                  <option value="Vila Ema">Vila Ema (Região Central)</option>
                  <option value="Santana">Santana (Zona Norte)</option>
                  <option value="Jardim Satélite">Jardim Satélite (Zona Sul)</option>
                  <option value="Bosque dos Eucaliptos">Bosque dos Eucaliptos (Zona Sul)</option>
                  <option value="Centro">Centro</option>
                  <option value="Eugênio de Melo">Eugênio de Melo (Zona Leste)</option>
                  <option value="Toda a Cidade (Geral)">Toda a Cidade (Geral)</option>
                </select>
              </div>

              {/* Caixa de Texto Bruto */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Cole o trecho bruto publicado:
                </label>
                <textarea
                  rows={8}
                  value={textoBruto}
                  onChange={(e) => setTextoBruto(e.target.value)}
                  placeholder="Cole aqui a ementa do projeto de lei, decreto ou matéria publicada no Diário de SJC..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              {/* Botão de Processar */}
              <Button
                variant="primary"
                onClick={handleProcessarIA}
                isLoading={isProcessing}
                className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Processar e Gerar com IA (Gemini Flash)</span>
              </Button>
            </div>

            {/* Coluna da Direita: Revisão & Live Preview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Prévia Cidadã (O que vai para o Feed)</span>
                  </h3>
                  {pautaRascunho && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Pendente de Aprovação
                    </span>
                  )}
                </div>

                {pautaRascunho ? (
                  <div className="space-y-4">
                    {/* Campos Editáveis Inline para o Administrador */}
                    <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                          Título do Card:
                        </label>
                        <input
                          type="text"
                          value={pautaRascunho.titulo}
                          onChange={(e) =>
                            setPautaRascunho({ ...pautaRascunho, titulo: e.target.value })
                          }
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                          Resumo Cidadão (Linguagem Simples):
                        </label>
                        <textarea
                          rows={2}
                          value={pautaRascunho.resumo_ia}
                          onChange={(e) =>
                            setPautaRascunho({ ...pautaRascunho, resumo_ia: e.target.value })
                          }
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                          Impacto Direto no Bairro:
                        </label>
                        <input
                          type="text"
                          value={pautaRascunho.impacto_bairro}
                          onChange={(e) =>
                            setPautaRascunho({ ...pautaRascunho, impacto_bairro: e.target.value })
                          }
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                            Vereador / Proponente:
                          </label>
                          <input
                            type="text"
                            value={pautaRascunho.vereador_proponente}
                            onChange={(e) =>
                              setPautaRascunho({
                                ...pautaRascunho,
                                vereador_proponente: e.target.value,
                              })
                            }
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                            Bairro Vinculado:
                          </label>
                          <input
                            type="text"
                            value={pautaRascunho.bairro_alvo}
                            onChange={(e) =>
                              setPautaRascunho({ ...pautaRascunho, bairro_alvo: e.target.value })
                            }
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Simulação Visual do Card exatamente como no Celular */}
                    <div className="border-2 border-emerald-500/40 rounded-2xl p-4 bg-white shadow-md space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 leading-none">
                              Meu Bairro: {pautaRascunho.bairro_alvo}
                            </h4>
                            <p className="text-[10px] text-gray-400">São José dos Campos - SP</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                          Votação em 48h
                        </span>
                      </div>

                      <h3 className="font-black text-sm text-gray-900 leading-snug">
                        {pautaRascunho.titulo}
                      </h3>

                      <div className="border border-gray-200 rounded-xl p-3 bg-neutral-50 text-xs space-y-1.5">
                        <div className="flex items-start space-x-1.5">
                          <span>🤖</span>
                          <p>
                            <strong className="text-emerald-700 font-bold">RESUMO INTELIGENTE: </strong>
                            <span>{pautaRascunho.resumo_ia}</span>
                          </p>
                        </div>
                        <p className="text-[11px] text-gray-600">
                          <strong>Impacto: </strong>
                          {pautaRascunho.impacto_bairro}
                        </p>
                        <p className="text-[11px] text-gray-600">
                          <strong>Autor: </strong>
                          {pautaRascunho.vereador_proponente}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 opacity-75">
                        <div className="py-2 rounded-full bg-[#1ea751] text-white text-xs font-black flex items-center justify-center space-x-1 cursor-default">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>CONCORDAR</span>
                        </div>
                        <div className="py-2 rounded-full bg-[#2b2f32] text-white text-xs font-black flex items-center justify-center space-x-1 cursor-default">
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                          <span>DISCORDAR</span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Aprovação Final */}
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        onClick={handlePublicar}
                        isLoading={isPublishing}
                        className="w-full py-3.5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center space-x-2 text-sm"
                      >
                        <ShieldCheck className="w-5 h-5" />
                        <span>Aprovar e Liberar no Feed de São José dos Campos</span>
                      </Button>
                      <p className="text-[10px] text-gray-400 text-center mt-1.5">
                        Ao clicar, a pauta entra instantaneamente no ar para todos os cidadãos votarem.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-gray-400 space-y-2 border-2 border-dashed border-gray-200 rounded-2xl">
                    <Sparkles className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-xs font-medium">Nenhum rascunho gerado ainda.</p>
                    <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                      Cole um texto ao lado e clique em &quot;Processar com IA&quot; para revisar o card antes de publicar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: PAUTAS PUBLICADAS & GESTÃO                        */}
      {/* ======================================================== */}
      {activeTab === 'publicadas' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-gray-900">
                Pautas no Ar em São José dos Campos
              </h3>
              <p className="text-xs text-gray-500">
                Acompanhamento do quórum de votos populares e controle das pautas ativas.
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
              Nenhuma pauta publicada ainda. Crie a primeira na aba &quot;Nova Pauta com IA&quot;.
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
      {/* ABA 3: CONFIGURAÇÕES DA IA & PROMPT MESTRE               */}
      {/* ======================================================== */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-black text-gray-900">
              Configurações do Motor de Inteligência Artificial
            </h3>
            <p className="text-xs text-gray-500">
              Personalize a chave de API do Gemini e as instruções de sistema que ensinam a IA a resumir as leis.
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
              O plano gratuito permite até 1.500 resumos por dia sem custo (R$ 0,00). Fica salva com segurança no seu navegador.
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
                Restaurar Padrão de Fábrica
              </button>
            </div>
            <textarea
              rows={12}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
            />
            <p className="text-[11px] text-gray-500">
              Dica: Você pode orientar a IA a focar em pontos específicos, como destacar valores monetários ou evitar menções partidárias.
            </p>
          </div>

          <Button type="submit" variant="primary" className="py-3 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
            Salvar Configurações
          </Button>
        </form>
      )}
    </div>
  );
}

