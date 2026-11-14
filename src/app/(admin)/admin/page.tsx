'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  UploadCloud,
  FileUp,
  MapPin,
  FileCode,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PautaIASummarized, SYSTEM_SUMMARIZER_PROMPT } from '@/prompts/summarizer';
import { PautaIA } from '@/types/database';
import { EdicaoSJC } from '@/app/api/diario/sjc/route';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'diario_api' | 'manual_upload' | 'publicadas' | 'config'>('diario_api');

  // Estado da API do Diário Oficial de SJC
  const [edicoesSJC, setEdicoesSJC] = useState<EdicaoSJC[]>([]);
  const [loadingEdicoes, setLoadingEdicoes] = useState(false);
  const [edicaoSelecionada, setEdicaoSelecionada] = useState<EdicaoSJC | null>(null);

  // Estados da Ingestão Manual / Outras Cidades
  const [manualCidade, setManualCidade] = useState('Jacareí');
  const [manualCidadeCustom, setManualCidadeCustom] = useState('');
  const [manualEstado, setManualEstado] = useState('SP');
  const [manualBairro, setManualBairro] = useState('Centro');
  const [manualFonte, setManualFonte] = useState('Boletim Oficial de Jacareí');
  const [manualModo, setManualModo] = useState<'texto' | 'pdf'>('texto');
  const [manualTexto, setManualTexto] = useState('');
  const [manualPdfFile, setManualPdfFile] = useState<File | null>(null);
  const [manualPdfBase64, setManualPdfBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [cidadeFiltro, setCidadeFiltro] = useState('todas');

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
  const carregarPautas = async (cidade: string = cidadeFiltro) => {
    setLoadingPautas(true);
    try {
      const url = cidade === 'todas' ? '/api/pautas?cidade=todas' : `/api/pautas?cidade=${encodeURIComponent(cidade)}`;
      const res = await fetch(url);
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
      carregarPautas(cidadeFiltro);
    }
  }, [activeTab, cidadeFiltro]);

  // Salvar configurações da IA
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('connecta_gemini_api_key', apiKey.trim());
    localStorage.setItem('connecta_system_prompt', customPrompt.trim());
    setStatusMessage('Configurações da IA salvas com sucesso!');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 3. Processar publicação oficial de SJC da API
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
          cidade_alvo: 'São José dos Campos',
          estado_alvo: 'SP',
        });
      }
    } catch (err: any) {
      alert(`Erro no processamento da IA: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Processar Ingestão Manual / Upload de PDF para Outras Cidades
  const handleProcessarManualComIA = async () => {
    const cidadeFinal = manualCidade === 'OUTRA' ? manualCidadeCustom.trim() : manualCidade;
    if (!cidadeFinal) {
      alert('Por favor, informe o nome do município.');
      return;
    }

    if (manualModo === 'texto' && !manualTexto.trim()) {
      alert('Por favor, cole o texto da lei ou edital da cidade.');
      return;
    }

    if (manualModo === 'pdf' && !manualPdfBase64) {
      alert('Por favor, faça upload de um arquivo PDF do Diário Oficial.');
      return;
    }

    setIsProcessing(true);
    setPublishSuccess(null);
    setPautaRascunho(null);

    try {
      const res = await fetch('/api/ia/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto_bruto: manualModo === 'texto' ? manualTexto : undefined,
          pdf_base64: manualModo === 'pdf' ? manualPdfBase64 : undefined,
          pdf_nome: manualPdfFile?.name,
          municipio: cidadeFinal,
          estado: manualEstado,
          bairro_sugerido: manualBairro,
          fonte_nome: manualFonte || `Diário Oficial de ${cidadeFinal}`,
          apiKey: apiKey || undefined,
          customPrompt: customPrompt !== SYSTEM_SUMMARIZER_PROMPT ? customPrompt : undefined,
        }),
      });

      if (!res.ok) throw new Error('Falha ao processar publicação com a IA');

      const data = await res.json();
      if (data.pauta) {
        setPautaRascunho({
          ...data.pauta,
          bairro_alvo: manualBairro || data.pauta.bairro_alvo,
          cidade_alvo: cidadeFinal,
          estado_alvo: manualEstado,
        });

        setEdicaoSelecionada({
          id: Date.now(),
          numero: Math.floor(100 + Math.random() * 900),
          data: new Date().toLocaleDateString('pt-BR'),
          tipo: `Diário Oficial de ${cidadeFinal}`,
          pdf_url: '',
          titulo_destaque: data.pauta.titulo,
          bairro_sugerido: manualBairro,
          secretaria: data.pauta.vereador_proponente,
          texto_resumo: data.pauta.resumo_ia,
        });
      }
    } catch (err: any) {
      alert(`Erro no processamento da IA: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload do PDF e conversão para Base64
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Selecione um arquivo no formato PDF.');
      return;
    }

    // Alerta de tamanho máximo para servidores em nuvem (4.5 MB)
    if (file.size > 4.5 * 1024 * 1024) {
      alert(
        `O arquivo selecionado possui ${(file.size / (1024 * 1024)).toFixed(1)} MB.\n\nPara garantir o processamento rápido pela IA e respeitar os limites de envio da nuvem, envie um PDF de até 4 MB (ex: selecione apenas as páginas do edital/decreto) ou use a "Opção A: Colar Texto".`
      );
      return;
    }

    setManualPdfFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setManualPdfBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Exemplos rápidos para testar pequenas cidades
  const carregarExemploCidade = (cidade: 'Jacareí' | 'Caçapava' | 'Taubaté') => {
    setManualModo('texto');
    if (cidade === 'Jacareí') {
      setManualCidade('Jacareí');
      setManualBairro('Parque Meia Lua');
      setManualFonte('Boletim Oficial de Jacareí - Edição nº 1.402');
      setManualTexto(
        `DECRETO MUNICIPAL Nº 512/2026 - PREFEITURA DE JACAREÍ
Autor: Poder Executivo Municipal (Prefeito)
Assunto: Dispõe sobre a revisão da tarifa do transporte coletivo de passageiros no município de Jacareí e institui subsídio tarifário municipal de R$ 1,20 por passagem para linhas alimentadoras dos bairros Parque Meia Lua, Jardim Esperança e Cidade Salvador, visando manter a tarifa congelada para usuários do cartão cidadão.`
      );
    } else if (cidade === 'Caçapava') {
      setManualCidade('Caçapava');
      setManualBairro('Vera Cruz');
      setManualFonte('Diário Oficial de Caçapava - Edição Extra');
      setManualTexto(
        `AVISO DE LICITAÇÃO - TOMADA DE PREÇOS Nº 08/2026 - PREFEITURA DE CAÇAPAVA
Secretaria de Obras e Planejamento Urbano
Objeto: Contratação de empresa de engenharia para pavimentação asfáltica, guias e sarjetas na Estrada Municipal do Vera Cruz e contenção de galeria pluvial no bairro Vila Menino Jesus. Prazo de execução: 120 dias. Valor estimado: R$ 1.450.000,00.`
      );
    } else {
      setManualCidade('Taubaté');
      setManualBairro('Centro');
      setManualFonte('Diário Oficial de Taubaté - Edição nº 2.890');
      setManualTexto(
        `PROJETO DE LEI ORDINÁRIA Nº 88/2026 - CÂMARA MUNICIPAL DE TAUBATÉ
Autor: Vereador Marcos Antônio
Ementa: Regulamenta os horários, pontos de parada e diretrizes sanitárias para a realização de feiras noturnas e praças gastronômicas em áreas públicas do Centro e do bairro Quiririm, proibindo a cobrança de taxas extraordinárias para comerciantes locais cadastrados há mais de 2 anos.`
      );
    }
  };

  // 5. APROVAÇÃO FINAL: Publicar no feed dos moradores
  const handleAprovarEPublicar = async () => {
    if (!pautaRascunho) return;

    setIsPublishing(true);
    const cidadeDestino = pautaRascunho.cidade_alvo || 'São José dos Campos';

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
          cidade_alvo: cidadeDestino,
          estado_alvo: pautaRascunho.estado_alvo || 'SP',
          cep_alvo: '12246-021',
          link_pdf_original: edicaoSelecionada?.pdf_url || null,
          fonte_diario: edicaoSelecionada ? edicaoSelecionada.tipo : `Diário Oficial de ${cidadeDestino}`,
          status: 'ativa',
        }),
      });

      if (!res.ok) throw new Error('Falha ao gravar pauta no banco de dados');

      setPublishSuccess(`✅ Pauta aprovada e publicada no feed de ${cidadeDestino}!`);
      setPautaRascunho(null);
      setEdicaoSelecionada(null);
      setManualPdfFile(null);
      setManualPdfBase64(null);
      setManualTexto('');
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
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
              Central de Moderação e Ingestão de Leis com IA
            </h2>
            <p className="text-[11px] text-gray-500">
              Conectado a São José dos Campos (API) e preparado para Ingestão Manual de qualquer município.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
            Curadoria Humana Ativa
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-1 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('diario_api')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'diario_api'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. SJC (API Ao Vivo)</span>
        </button>

        <button
          onClick={() => setActiveTab('manual_upload')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'manual_upload'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-emerald-600" />
          <span>2. Outras Cidades (Upload / Manual)</span>
        </button>

        <button
          onClick={() => setActiveTab('publicadas')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'publicadas'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. Pautas no Ar ({pautasPublicadas.length || '...'})</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'config'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>4. Chave IA & Prompts</span>
        </button>
      </div>

      {/* Notificação de Sucesso Global */}
      {publishSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">{publishSuccess}</p>
              <p className="text-[11px] text-emerald-700">A pauta já está aberta para votos dos moradores no app.</p>
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

      {/* ÁREA DE REVISÃO E APROVAÇÃO (COMPARTILHADA POR TODAS AS ABAS QUANDO A IA GERA RASCUNHO) */}
      {pautaRascunho && (
        <div className="bg-emerald-50/70 border-2 border-emerald-500 rounded-3xl p-5 sm:p-6 shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-700" />
              <h3 className="text-sm sm:text-base font-black text-emerald-950">
                A IA gerou a pauta para {pautaRascunho.cidade_alvo || 'o Município'}. Você aprova a publicação?
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

            {/* Lado Direito: Prévia Visual do Card */}
            <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Como o morador verá no Feed:
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {pautaRascunho.cidade_alvo || 'Município'}
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
                    <p className="text-[10px] text-gray-400">{pautaRascunho.cidade_alvo} - {pautaRascunho.estado_alvo || 'SP'}</p>
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

              {/* Botões de Decisão */}
              <div className="pt-2 space-y-2">
                <Button
                  variant="primary"
                  onClick={handleAprovarEPublicar}
                  isLoading={isPublishing}
                  className="w-full py-3 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-xs flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Aprovar e Liberar no Feed de {pautaRascunho.cidade_alvo}</span>
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

      {/* ======================================================== */}
      {/* ABA 1: SÃO JOSÉ DOS CAMPOS (API AO VIVO)                 */}
      {/* ======================================================== */}
      {activeTab === 'diario_api' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-gray-900">
                Publicações do Diário Oficial de São José dos Campos
              </h3>
              <p className="text-xs text-gray-500">
                Puxadas em tempo real da fonte oficial da prefeitura (Código IBGE: 3549904).
              </p>
            </div>

            <button
              onClick={carregarEdicoesDiario}
              disabled={loadingEdicoes}
              className="text-xs font-bold text-gray-700 hover:text-emerald-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingEdicoes ? 'animate-spin' : ''}`} />
              <span>Atualizar Lista</span>
            </button>
          </div>

          {loadingEdicoes ? (
            <div className="py-16 text-center text-xs text-gray-500 space-y-2 bg-white rounded-2xl border border-gray-200">
              <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
              <p className="font-bold">Consultando API oficial de São José dos Campos...</p>
            </div>
          ) : edicoesSJC.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-200">
              Nenhuma publicação encontrada no momento.
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
                      <span className="text-[10px] text-gray-400">{edicao.secretaria}</span>
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
      )}

      {/* ======================================================== */}
      {/* ABA 2: OUTRAS CIDADES (UPLOAD DE PDF OU TEXTO MANUAL)    */}
      {/* ======================================================== */}
      {activeTab === 'manual_upload' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="space-y-1 border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-gray-900">
                Ingestão para Municípios sem API Automática
              </h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Para cidades pequenas do interior ou municípios vizinhos (Jacareí, Caçapava, Taubaté, etc.) que não possuem API aberta. Você pode fazer <strong>upload do PDF oficial</strong> da prefeitura ou colar o texto de um decreto/edital.
            </p>
          </div>

          {/* Seletor de Município e Bairro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                Município Alvo:
              </label>
              <select
                value={manualCidade}
                onChange={(e) => {
                  setManualCidade(e.target.value);
                  if (e.target.value !== 'OUTRA') {
                    setManualFonte(`Diário Oficial de ${e.target.value}`);
                  }
                }}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Jacareí">Jacareí - SP</option>
                <option value="Caçapava">Caçapava - SP</option>
                <option value="Taubaté">Taubaté - SP</option>
                <option value="Pindamonhangaba">Pindamonhangaba - SP</option>
                <option value="Guaratinguetá">Guaratinguetá - SP</option>
                <option value="São José dos Campos">São José dos Campos - SP</option>
                <option value="OUTRA">+ Outra Cidade (Digitar)</option>
              </select>
            </div>

            {manualCidade === 'OUTRA' && (
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                  Nome da Cidade:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tremembé"
                  value={manualCidadeCustom}
                  onChange={(e) => setManualCidadeCustom(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                Bairro ou Região Alvo:
              </label>
              <input
                type="text"
                placeholder="Ex: Centro, Parque Meia Lua..."
                value={manualBairro}
                onChange={(e) => setManualBairro(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                Identificação da Fonte:
              </label>
              <input
                type="text"
                placeholder="Ex: Boletim Oficial nº 120"
                value={manualFonte}
                onChange={(e) => setManualFonte(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700"
              />
            </div>
          </div>

          {/* Exemplos Rápidos com 1 Clique */}
          <div className="space-y-1.5 bg-neutral-50 p-3 rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              Testar com exemplos reais de cidades vizinhas:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => carregarExemploCidade('Jacareí')}
                className="py-1 px-3 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 text-xs font-semibold border border-gray-200 shadow-2xs transition-colors"
              >
                🚌 Jacareí (Subsídio Tarifa Ônibus)
              </button>
              <button
                type="button"
                onClick={() => carregarExemploCidade('Caçapava')}
                className="py-1 px-3 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 text-xs font-semibold border border-gray-200 shadow-2xs transition-colors"
              >
                🚧 Caçapava (Drenagem e Asfalto)
              </button>
              <button
                type="button"
                onClick={() => carregarExemploCidade('Taubaté')}
                className="py-1 px-3 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 text-xs font-semibold border border-gray-200 shadow-2xs transition-colors"
              >
                🍎 Taubaté (Feiras e Comércio)
              </button>
            </div>
          </div>

          {/* Alternância: Upload de PDF vs Colar Texto */}
          <div className="flex border-b border-gray-200 space-x-4">
            <button
              type="button"
              onClick={() => setManualModo('texto')}
              className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
                manualModo === 'texto'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Opção A: Colar Texto do Edital / Decreto</span>
            </button>
            <button
              type="button"
              onClick={() => setManualModo('pdf')}
              className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
                manualModo === 'pdf'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Opção B: Upload de Arquivo PDF do Diário</span>
            </button>
          </div>

          {/* MODO TEXTO */}
          {manualModo === 'texto' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Texto do Edital, Lei ou Publicação Municipal:
              </label>
              <textarea
                rows={7}
                value={manualTexto}
                onChange={(e) => setManualTexto(e.target.value)}
                placeholder="Cole aqui o texto da publicação oficial da prefeitura ou câmara..."
                className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
              />
            </div>
          )}

          {/* MODO UPLOAD DE PDF */}
          {manualModo === 'pdf' && (
            <div className="space-y-3">
              <input
                type="file"
                accept=".pdf,application/pdf"
                ref={fileInputRef}
                onChange={handlePdfUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all text-center space-y-2"
              >
                {manualPdfFile ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-gray-900">{manualPdfFile.name}</p>
                    <p className="text-[10px] text-gray-500">
                      Tamanho: {(manualPdfFile.size / 1024).toFixed(1)} KB • Pronto para leitura direta com a IA
                    </p>
                    <span className="text-[11px] text-emerald-600 underline font-semibold block pt-1">
                      Clique para trocar de arquivo
                    </span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-10 h-10 text-emerald-600" />
                    <p className="text-xs font-bold text-gray-800">
                      Arraste ou clique para carregar o PDF do Diário Oficial
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Compatível com PDFs de decretos, leis orçamentárias e atos municipais
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Botão de Processar */}
          <Button
            variant="primary"
            onClick={handleProcessarManualComIA}
            isLoading={isProcessing}
            className="w-full py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center justify-center space-x-2 shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Processar Publicação com IA e Gerar Prévia</span>
          </Button>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 3: PAUTAS NO AR (PUBLICADAS & RECEBENDO VOTOS)       */}
      {/* ======================================================== */}
      {activeTab === 'publicadas' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-black text-gray-900">
                Pautas no Ar nos Municípios
              </h3>
              <p className="text-xs text-gray-500">
                Acompanhamento dos votos populares nas pautas liberadas.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={cidadeFiltro}
                onChange={(e) => setCidadeFiltro(e.target.value)}
                className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
              >
                <option value="todas">Todas as Cidades</option>
                <option value="São José dos Campos">São José dos Campos</option>
                <option value="Jacareí">Jacareí</option>
                <option value="Caçapava">Caçapava</option>
                <option value="Taubaté">Taubaté</option>
              </select>

              <button
                onClick={() => carregarPautas(cidadeFiltro)}
                className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPautas ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loadingPautas ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Carregando pautas do banco de dados...
            </div>
          ) : pautasPublicadas.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Nenhuma pauta aprovada para este filtro.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pautasPublicadas.map((pauta) => (
                <div key={pauta.id} className="py-3.5 flex items-start justify-between space-x-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {pauta.cidade_alvo || 'SJC'} • {pauta.bairro_alvo || 'Geral'}
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
      {/* ABA 4: CHAVE DA IA & PROMPTS                             */}
      {/* ======================================================== */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-black text-gray-900">
              Configurações da Inteligência Artificial
            </h3>
            <p className="text-xs text-gray-500">
              Insira sua chave gratuita do Google Gemini e edite os comandos que ensinam a IA a resumir as leis.
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
