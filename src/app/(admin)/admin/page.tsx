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
  Mail,
  SendHorizontal,
  Stamp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PautaIASummarized, SYSTEM_SUMMARIZER_PROMPT } from '@/prompts/summarizer';
import { PautaIA } from '@/types/database';
import { EdicaoSJC } from '@/app/api/diario/sjc/route';

export interface PeticaoModeracao {
  id: string;
  titulo: string;
  bairro: string;
  cidade: string;
  totalDiscordancias: number;
  quorumMinimo: number;
  vereadorAlvo: string;
  emailAlvo: string;
  argumentosMoradores: string[];
  minutaIA: string;
  status: 'pendente_revisao' | 'aprovada_enviada' | 'rejeitada';
  dataQuorum: string;
  simulouEnvio?: boolean;
}

const PETICOES_MODERACAO_INICIAIS: PeticaoModeracao[] = [
  {
    id: 'pet-mod-1',
    titulo: 'Petição Popular contra o Fechamento de Faixas de Trânsito na Av. Cassiano Ricardo',
    bairro: 'Jardim Aquárius',
    cidade: 'São José dos Campos',
    totalDiscordancias: 64,
    quorumMinimo: 50,
    vereadorAlvo: 'Marcio Roberto (Câmara Municipal)',
    emailAlvo: 'gabinete.marcioroberto@camarasjc.sp.gov.br',
    argumentosMoradores: [
      'Gargalo severo no horário de pico entre 17h30 e 19h30.',
      'Falta de estudo prévio de impacto de tráfego apresentado aos moradores.',
      'Dificuldade de acesso para viaturas de resgate e ambulâncias.',
    ],
    minutaIA: 'Os abaixo-assinados, cidadãos residentes no Jardim Aquárius, com esteio no art. 5º, XXXIV da CF, requerem a imediata suspensão da alteração viária e a realização de audiência pública com a comunidade.',
    status: 'pendente_revisao',
    dataQuorum: 'Hoje às 14:20',
  },
  {
    id: 'pet-mod-2',
    titulo: 'Impugnação ao Edital de Cobrança Extraordinária de Coleta de Resíduos Noturnos',
    bairro: 'Centro',
    cidade: 'São José dos Campos',
    totalDiscordancias: 82,
    quorumMinimo: 50,
    vereadorAlvo: 'Secretaria de Gestão Administrativa e Finanças',
    emailAlvo: 'financas@sjc.sp.gov.br',
    argumentosMoradores: [
      'Bitributação indevida pois o IPTU já recolhe taxas de conservação urbana.',
      'Ausência de diálogo com o comércio e moradores da área central.',
    ],
    minutaIA: 'Requer-se a revogação do edital e a demonstração contábil do rateio dos custos de coleta noturna, sob pena de representação junto ao Tribunal de Contas do Estado.',
    status: 'pendente_revisao',
    dataQuorum: 'Ontem às 21:05',
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'diario_api' | 'manual_upload' | 'publicadas' | 'peticoes_mod' | 'config'>('diario_api');

  // Estado da Fila de Moderação de Petições Cívicas (Quórum Atingido)
  const [peticoesFila, setPeticoesFila] = useState<PeticaoModeracao[]>(PETICOES_MODERACAO_INICIAIS);

  // Estado da API do Diário Oficial de SJC
  const [edicoesSJC, setEdicoesSJC] = useState<EdicaoSJC[]>([]);
  const [loadingEdicoes, setLoadingEdicoes] = useState(false);
  const [edicaoSelecionada, setEdicaoSelecionada] = useState<EdicaoSJC | null>(null);

  // Estados da Ingestão Manual / Outras Cidades
  const [manualCidade, setManualCidade] = useState('São José dos Campos');
  const [manualCidadeCustom, setManualCidadeCustom] = useState('');
  const [manualEstado, setManualEstado] = useState('SP');
  const [manualBairro, setManualBairro] = useState('Centro');
  const [manualFonte, setManualFonte] = useState('Diário do Município de São José dos Campos');
  const [manualModo, setManualModo] = useState<'texto' | 'pdf'>('pdf');
  const [manualTexto, setManualTexto] = useState('');
  const [manualPdfFile, setManualPdfFile] = useState<File | null>(null);
  const [manualPdfBase64, setManualPdfBase64] = useState<string | null>(null);
  const [autoDetectNotice, setAutoDetectNotice] = useState<string | null>(null);
  const [fonteIA, setFonteIA] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configurações da IA
  const [apiKey, setApiKey] = useState('');
  const [customPrompt, setCustomPrompt] = useState(SYSTEM_SUMMARIZER_PROMPT);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Estados de Processamento e Publicação
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  // Lista de rascunhos de pautas para revisão individual ou em lote
  const [pautasRascunho, setPautasRascunho] = useState<
    (PautaIASummarized & { id_temp: string; aprovada?: boolean; descartada?: boolean })[]
  >([]);
  const [aprovandoId, setAprovandoId] = useState<string | null>(null);

  // Lista de pautas publicadas
  const [pautasPublicadas, setPautasPublicadas] = useState<PautaIA[]>([]);
  const [loadingPautas, setLoadingPautas] = useState(false);
  const [cidadeFiltro, setCidadeFiltro] = useState('todas');

  // Estado do Cron Noturno Automatizado
  const [executingCron, setExecutingCron] = useState(false);
  const [cronResult, setCronResult] = useState<any>(null);

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
    setPautasRascunho([]);

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
          pdf_url: edicao.pdf_url || undefined,
          texto_bruto: textoParaIA,
          municipio: 'São José dos Campos',
          estado: 'SP',
          fonte_nome: `Diário Oficial de SJC nº ${edicao.numero} (${edicao.data})`,
          apiKey: apiKey || undefined,
          customPrompt: customPrompt !== SYSTEM_SUMMARIZER_PROMPT ? customPrompt : undefined,
        }),
      });

      if (!res.ok) throw new Error('Falha ao processar matérias da edição');

      const data = await res.json();
      setFonteIA(data.source || 'ia');
      const listaRecebida = data.pautas || (data.pauta ? [data.pauta] : []);

      if (listaRecebida.length > 0) {
        setPautasRascunho(
          listaRecebida.map((p: any, i: number) => ({
            ...p,
            id_temp: p.id_temp || `pauta_${Date.now()}_${i}`,
            bairro_alvo: p.bairro_alvo || edicao.bairro_sugerido || 'Centro',
            cidade_alvo: 'São José dos Campos',
            estado_alvo: 'SP',
          }))
        );
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
    setPautasRascunho([]);

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
      setFonteIA(data.source || 'ia');
      const listaRecebida = data.pautas || (data.pauta ? [data.pauta] : []);

      if (listaRecebida.length > 0) {
        setPautasRascunho(
          listaRecebida.map((p: any, i: number) => ({
            ...p,
            id_temp: p.id_temp || `pauta_${Date.now()}_${i}`,
            bairro_alvo: p.bairro_alvo || manualBairro || 'Centro',
            cidade_alvo: p.cidade_alvo || cidadeFinal,
            estado_alvo: manualEstado,
          }))
        );

        const primeira = listaRecebida[0];
        setEdicaoSelecionada({
          id: Date.now(),
          numero: Math.floor(100 + Math.random() * 900),
          data: new Date().toLocaleDateString('pt-BR'),
          tipo: `Diário Oficial de ${primeira.cidade_alvo || cidadeFinal}`,
          pdf_url: '',
          titulo_destaque: primeira.titulo,
          bairro_sugerido: manualBairro,
          secretaria: primeira.vereador_proponente,
          texto_resumo: primeira.resumo_ia,
        });
      }
    } catch (err: any) {
      alert(`Erro no processamento da IA: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload do PDF, auto-detecção de município e conversão para Base64
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

    // Auto-detecção inteligente de município a partir do nome do arquivo
    const nomeLower = file.name.toLowerCase();
    if (
      nomeLower.startsWith('dm_') ||
      nomeLower.includes('sjc') ||
      nomeLower.includes('sao_jose') ||
      nomeLower.includes('são josé')
    ) {
      setManualCidade('São José dos Campos');
      setManualFonte('Diário do Município de São José dos Campos');
      setAutoDetectNotice('✅ Arquivo identificado como Diário Oficial de São José dos Campos. Município selecionado automaticamente.');
    } else if (nomeLower.includes('jacarei') || nomeLower.includes('jacareí')) {
      setManualCidade('Jacareí');
      setManualFonte('Boletim Oficial de Jacareí');
      setAutoDetectNotice('✅ Arquivo identificado como Boletim Oficial de Jacareí.');
    } else if (nomeLower.includes('cacapava') || nomeLower.includes('caçapava')) {
      setManualCidade('Caçapava');
      setManualFonte('Diário Oficial de Caçapava');
      setAutoDetectNotice('✅ Arquivo identificado como Diário Oficial de Caçapava.');
    } else if (nomeLower.includes('taubate') || nomeLower.includes('taubaté')) {
      setManualCidade('Taubaté');
      setManualFonte('Diário Oficial de Taubaté');
      setAutoDetectNotice('✅ Arquivo identificado como Diário Oficial de Taubaté.');
    } else {
      setAutoDetectNotice(null);
    }

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

  // 5. APROVAÇÃO INDIVIDUAL: Publicar uma pauta específica no feed dos moradores
  const handleAprovarPautaIndividual = async (idTemp: string) => {
    const pauta = pautasRascunho.find((p) => p.id_temp === idTemp);
    if (!pauta) return;

    setAprovandoId(idTemp);
    const cidadeDestino = pauta.cidade_alvo || 'São José dos Campos';

    try {
      const res = await fetch('/api/pautas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: pauta.titulo,
          resumo_ia: pauta.resumo_ia,
          impacto_bairro: pauta.impacto_bairro,
          vereador_proponente: pauta.vereador_proponente,
          bairro_alvo: pauta.bairro_alvo,
          cidade_alvo: cidadeDestino,
          estado_alvo: pauta.estado_alvo || 'SP',
          cep_alvo: '12246-021',
          link_pdf_original: edicaoSelecionada?.pdf_url || null,
          fonte_diario: edicaoSelecionada ? edicaoSelecionada.tipo : `Diário Oficial de ${cidadeDestino}`,
          status: 'ativa',
        }),
      });

      if (!res.ok) throw new Error('Falha ao gravar pauta no banco de dados');

      setPautasRascunho((prev) =>
        prev.map((item) => (item.id_temp === idTemp ? { ...item, aprovada: true } : item))
      );
      setPublishSuccess(`✅ Matéria "${pauta.titulo}" aprovada e publicada no feed de ${pauta.bairro_alvo}!`);
      carregarPautas();
    } catch (err: any) {
      alert(`Erro ao aprovar matéria: ${err.message}`);
    } finally {
      setAprovandoId(null);
    }
  };

  // 6. APROVAÇÃO EM LOTE: Publicar todas as matérias pendentes
  const handleAprovarTodas = async () => {
    const pendentes = pautasRascunho.filter((p) => !p.aprovada && !p.descartada);
    if (pendentes.length === 0) return;

    setIsPublishing(true);
    let aprovadasCount = 0;

    for (const pauta of pendentes) {
      try {
        const res = await fetch('/api/pautas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo: pauta.titulo,
            resumo_ia: pauta.resumo_ia,
            impacto_bairro: pauta.impacto_bairro,
            vereador_proponente: pauta.vereador_proponente,
            bairro_alvo: pauta.bairro_alvo,
            cidade_alvo: pauta.cidade_alvo || 'São José dos Campos',
            estado_alvo: pauta.estado_alvo || 'SP',
            cep_alvo: '12246-021',
            link_pdf_original: edicaoSelecionada?.pdf_url || null,
            fonte_diario: edicaoSelecionada ? edicaoSelecionada.tipo : `Diário Oficial de ${pauta.cidade_alvo}`,
            status: 'ativa',
          }),
        });
        if (res.ok) aprovadasCount++;
      } catch (e) {
        console.error('Erro ao aprovar matéria em lote:', e);
      }
    }

    setPautasRascunho((prev) =>
      prev.map((item) => (!item.descartada ? { ...item, aprovada: true } : item))
    );
    setIsPublishing(false);
    setPublishSuccess(`✅ ${aprovadasCount} matérias foram aprovadas e publicadas com sucesso nos feeds dos moradores!`);
    carregarPautas();
  };

  // 7. DESCARTAR MATÉRIA INDIVIDUAL
  const handleDescartarPauta = (idTemp: string) => {
    setPautasRascunho((prev) =>
      prev.map((item) => (item.id_temp === idTemp ? { ...item, descartada: true } : item))
    );
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

  // Disparo manual do Cron Noturno para teste
  const handleExecutarCron = async () => {
    setExecutingCron(true);
    setCronResult(null);
    try {
      const res = await fetch('/api/cron/diario-sjc', { method: 'POST' });
      const data = await res.json();
      setCronResult(data);
      if (data.success) {
        carregarPautas();
      }
    } catch (err: any) {
      alert('Erro ao executar cron: ' + err.message);
    } finally {
      setExecutingCron(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-crimson-500"></span>
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

        <div className="flex flex-wrap items-center gap-2">
          {apiKey ? (
            <span className="text-[10px] bg-crimson-100 text-crimson-800 font-bold px-2.5 py-1 rounded-full border border-crimson-200 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-crimson-600" />
              <span>IA Gemini Conectada</span>
            </span>
          ) : (
            <button
              onClick={() => setActiveTab('config')}
              className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2.5 py-1 rounded-full border border-amber-300 flex items-center space-x-1 transition-colors"
            >
              <span>⚠️ Modo Local (Configurar Chave Gemini)</span>
            </button>
          )}
          <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-full border border-gray-200">
            Curadoria Humana Ativa
          </span>
        </div>
      </div>

      {/* Alerta de Modo de IA quando não há chave configurada */}
      {!apiKey && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="text-base">💡</span>
            <span>
              <strong>Dica de Produção:</strong> Nenhuma chave do Gemini está salva. O sistema está usando o <strong>Extrator Local Inteligente</strong>. Para a IA ler e analisar o PDF na íntegra com raciocínio contextual do <strong>Google Gemini 1.5 Flash</strong>, adicione sua chave gratuita na{' '}
              <button
                onClick={() => setActiveTab('config')}
                className="font-bold underline hover:text-amber-950"
              >
                Aba 4 (Chave IA & Prompts)
              </button>
              .
            </span>
          </div>
        </div>
      )}

      {/* Banner de Automação Noturna (Cron Diário Oficial) */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-crimson-600 flex items-center justify-center text-xs font-bold shadow-crimson-btn">
              ⚡
            </span>
            <h3 className="text-sm font-black text-white tracking-tight">
              Automação Noturna (Vercel Cron • Diário Oficial SJC)
            </h3>
            <span className="text-[10px] bg-crimson-950 text-crimson-300 border border-crimson-800 font-bold px-2 py-0.5 rounded-full">
              Ativo às 02:00 BRT
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Todas as madrugadas, a IA busca novas edições no portal da prefeitura de São José dos Campos, extrai decretos e obras por bairro e publica no feed do cidadão.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant="primary"
            onClick={handleExecutarCron}
            isLoading={executingCron}
            className="text-xs font-bold py-2.5 px-4 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white shadow-crimson-btn flex items-center space-x-1.5"
          >
            <span>Executar Agora (Teste Manual)</span>
          </Button>
        </div>
      </div>

      {/* Relatório de Execução do Cron (se disparado) */}
      {cronResult && (
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2 animate-fadeIn text-xs">
          <div className="flex items-center justify-between font-bold text-zinc-900">
            <span className="flex items-center gap-1.5 text-crimson-700">
              <CheckCircle2 className="w-4 h-4 text-crimson-600" />
              Rotina Noturna Executada com Sucesso!
            </span>
            <span className="text-zinc-500 text-[11px] font-mono">{cronResult.timestamp}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
              <span className="text-zinc-400 block font-semibold">Edição de SJC:</span>
              <strong className="text-zinc-900 font-bold">Ed. #{cronResult.edicao_numero}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-zinc-200">
              <span className="text-zinc-400 block font-semibold">Novas Pautas Mineradas:</span>
              <strong className="text-crimson-700 font-black">+{cronResult.novas_pautas_publicadas} matérias</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-zinc-200 col-span-2 sm:col-span-1">
              <span className="text-zinc-400 block font-semibold">Origem:</span>
              <strong className="text-zinc-900">{cronResult.origem}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-1 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('diario_api')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'diario_api'
              ? 'border-crimson-600 text-crimson-800'
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
              ? 'border-crimson-600 text-crimson-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-crimson-600" />
          <span>2. Outras Cidades (Upload / Manual)</span>
        </button>

        <button
          onClick={() => setActiveTab('publicadas')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'publicadas'
              ? 'border-crimson-600 text-crimson-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. Pautas no Ar ({pautasPublicadas.length || '...'})</span>
        </button>

        <button
          onClick={() => setActiveTab('peticoes_mod')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'peticoes_mod'
              ? 'border-crimson-600 text-crimson-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Stamp className="w-4 h-4 text-crimson-600" />
          <span>4. Moderação de Petições</span>
          {peticoesFila.filter((p) => p.status === 'pendente_revisao').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-crimson-600 text-white text-[10px] font-black">
              {peticoesFila.filter((p) => p.status === 'pendente_revisao').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeTab === 'config'
              ? 'border-crimson-600 text-crimson-800'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>5. Chave IA & Prompts</span>
        </button>
      </div>

      {/* Notificação de Sucesso Global */}
      {publishSuccess && (
        <div className="p-4 bg-crimson-50 border border-crimson-300 rounded-2xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-crimson-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-crimson-950">{publishSuccess}</p>
              <p className="text-[11px] text-crimson-700">A pauta já está aberta para votos dos moradores no app.</p>
            </div>
          </div>
          <Link
            href="/feed"
            className="py-1.5 px-3 bg-crimson-600 hover:bg-crimson-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
          >
            <span>Ver no Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ÁREA DE REVISÃO E APROVAÇÃO MULTI-PAUTAS */}
      {pautasRascunho.some((p) => !p.descartada) && (
        <div className="bg-crimson-50/70 border-2 border-crimson-500 rounded-3xl p-5 sm:p-6 shadow-md space-y-5 animate-fadeIn">
          {/* Header do Bloco Multi-Pautas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-crimson-200 pb-3 gap-3">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-crimson-700 shrink-0" />
              <div>
                <h3 className="text-sm sm:text-base font-black text-crimson-950">
                  {pautasRascunho.filter((p) => !p.descartada).length}{' '}
                  {pautasRascunho.filter((p) => !p.descartada).length === 1
                    ? 'Matéria Identificada nesta Edição'
                    : 'Matérias Identificadas nesta Edição'}
                </h3>
                <span className="text-[10px] font-bold text-crimson-700">
                  {fonteIA?.includes('gemini')
                    ? '✨ Segmentado com o modelo Google Gemini 1.5 Flash'
                    : '🔍 Segmentado pelo Extrator Local Inteligente (Motor de contingência)'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="primary"
                onClick={handleAprovarTodas}
                isLoading={isPublishing}
                disabled={pautasRascunho.every((p) => p.aprovada || p.descartada)}
                className="py-1.5 px-3.5 bg-crimson-600 hover:bg-crimson-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Aprovar Todas</span>
              </Button>
              <button
                onClick={() => setPautasRascunho([])}
                className="text-xs text-gray-500 hover:text-gray-900 font-bold px-2 py-1"
              >
                ✕ Fechar
              </button>
            </div>
          </div>

          {/* Lista de Cards de Matérias Segmentadas */}
          <div className="space-y-4">
            {pautasRascunho
              .filter((p) => !p.descartada)
              .map((pauta, idx) => (
                <div
                  key={pauta.id_temp}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    pauta.aprovada
                      ? 'bg-crimson-100/70 border-crimson-400'
                      : 'bg-white border-gray-200 shadow-sm hover:border-crimson-300'
                  }`}
                >
                  {pauta.aprovada ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="w-6 h-6 text-crimson-600 shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-black text-crimson-700 tracking-wider">
                            Matéria #{idx + 1} • Publicada com Sucesso
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-crimson-950">
                            {pauta.titulo}
                          </h4>
                          <p className="text-[11px] text-crimson-800">
                            Liberada no feed de <strong>{pauta.bairro_alvo}</strong> ({pauta.cidade_alvo} - {pauta.estado_alvo}).
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/feed"
                        className="py-1.5 px-3 bg-crimson-700 hover:bg-crimson-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1 self-start sm:self-auto shrink-0"
                      >
                        <span>Ver no Feed</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Top Bar da Matéria: Categoria, Relevância e Ações */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black bg-crimson-50 text-crimson-800 border border-crimson-200 px-2 py-0.5 rounded-md uppercase">
                            Matéria #{idx + 1}
                          </span>
                          {pauta.categoria && (
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                              {pauta.categoria === 'gastos' && '💰 Gastos Públicos'}
                              {pauta.categoria === 'obras' && '🚧 Obras & Infraestrutura'}
                              {pauta.categoria === 'governanca' && '🏛️ Atos do Executivo'}
                              {pauta.categoria === 'transporte' && '🚌 Transporte & Mobilidade'}
                              {pauta.categoria === 'zoneamento' && '📐 Zoneamento & Urbanismo'}
                              {pauta.categoria === 'geral' && '📋 Legislação Geral'}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-bold">
                            Relevância: {pauta.relevancia_score}%
                          </span>
                        </div>

                        <button
                          onClick={() => handleDescartarPauta(pauta.id_temp)}
                          className="text-[11px] text-gray-400 hover:text-red-600 font-bold flex items-center space-x-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Descartar Matéria</span>
                        </button>
                      </div>

                      {/* Campos Editáveis */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                        <div className="lg:col-span-12">
                          <label className="text-[10px] font-bold text-gray-600 uppercase block mb-0.5">
                            Título da Pauta:
                          </label>
                          <input
                            type="text"
                            value={pauta.titulo}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPautasRascunho((prev) =>
                                prev.map((item) => (item.id_temp === pauta.id_temp ? { ...item, titulo: val } : item))
                              );
                            }}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-gray-900 focus:bg-white focus:ring-1 focus:ring-crimson-500"
                          />
                        </div>

                        <div className="lg:col-span-8">
                          <label className="text-[10px] font-bold text-gray-600 uppercase block mb-0.5">
                            Resumo Cidadão (Linguagem Acessível):
                          </label>
                          <textarea
                            rows={2}
                            value={pauta.resumo_ia}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPautasRascunho((prev) =>
                                prev.map((item) => (item.id_temp === pauta.id_temp ? { ...item, resumo_ia: val } : item))
                              );
                            }}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:ring-1 focus:ring-crimson-500"
                          />
                        </div>

                        <div className="lg:col-span-4">
                          <label className="text-[10px] font-bold text-gray-600 uppercase block mb-0.5">
                            Impacto Prático:
                          </label>
                          <textarea
                            rows={2}
                            value={pauta.impacto_bairro}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPautasRascunho((prev) =>
                                prev.map((item) => (item.id_temp === pauta.id_temp ? { ...item, impacto_bairro: val } : item))
                              );
                            }}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:ring-1 focus:ring-crimson-500"
                          />
                        </div>

                        <div className="lg:col-span-6">
                          <label className="text-[10px] font-bold text-gray-600 uppercase block mb-0.5">
                            Autor / Secretaria:
                          </label>
                          <input
                            type="text"
                            value={pauta.vereador_proponente}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPautasRascunho((prev) =>
                                prev.map((item) => (item.id_temp === pauta.id_temp ? { ...item, vereador_proponente: val } : item))
                              );
                            }}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white"
                          />
                        </div>

                        <div className="lg:col-span-6">
                          <label className="text-[10px] font-bold text-gray-600 uppercase block mb-0.5">
                            Bairro ou Região Vinculada:
                          </label>
                          <input
                            type="text"
                            value={pauta.bairro_alvo}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPautasRascunho((prev) =>
                                prev.map((item) => (item.id_temp === pauta.id_temp ? { ...item, bairro_alvo: val } : item))
                              );
                            }}
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Botão de Aprovação Individual */}
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                        <Button
                          variant="primary"
                          onClick={() => handleAprovarPautaIndividual(pauta.id_temp)}
                          isLoading={aprovandoId === pauta.id_temp}
                          className="py-2 px-4 rounded-xl font-bold bg-crimson-600 hover:bg-crimson-700 text-white text-xs flex items-center space-x-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Aprovar e Publicar no Feed de {pauta.bairro_alvo}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
              className="text-xs font-bold text-gray-700 hover:text-crimson-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingEdicoes ? 'animate-spin' : ''}`} />
              <span>Atualizar Lista</span>
            </button>
          </div>

          <div className="p-3 bg-crimson-50/60 border border-crimson-200 rounded-2xl flex items-center space-x-2 text-xs text-crimson-950">
            <span className="text-base">💡</span>
            <span>
              <strong>Dica para São José dos Campos:</strong> As edições oficiais (inclusive a <strong>Edição nº 3.826 de 11/11/2026</strong>) são conectadas ao vivo abaixo. Basta clicar em <strong>&quot;Resumir com IA e Revisar&quot;</strong> direto na publicação desejada, sem precisar baixar ou subir arquivos manualmente!
            </span>
          </div>

          {loadingEdicoes ? (
            <div className="py-16 text-center text-xs text-gray-500 space-y-2 bg-white rounded-2xl border border-gray-200">
              <RefreshCw className="w-6 h-6 text-crimson-600 animate-spin mx-auto" />
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
                  className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-crimson-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-lg border border-gray-200">
                        Edição nº {edicao.numero} • {edicao.data}
                      </span>
                      <span className="text-[10px] bg-crimson-50 text-crimson-800 font-bold px-2 py-0.5 rounded-lg border border-crimson-200">
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
                        className="text-[11px] font-bold text-gray-500 hover:text-crimson-700 flex items-center space-x-1"
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
                      className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold bg-crimson-600 hover:bg-crimson-700 text-white text-xs flex items-center justify-center space-x-2 shadow-sm"
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
              <UploadCloud className="w-5 h-5 text-crimson-600" />
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
                    setManualFonte(
                      e.target.value === 'São José dos Campos'
                        ? 'Diário do Município de São José dos Campos'
                        : `Diário Oficial de ${e.target.value}`
                    );
                  }
                }}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-crimson-500"
              >
                <option value="São José dos Campos">São José dos Campos - SP (Piloto Ativo)</option>
                <option value="Jacareí">Jacareí - SP</option>
                <option value="Caçapava">Caçapava - SP</option>
                <option value="Taubaté">Taubaté - SP</option>
                <option value="Pindamonhangaba">Pindamonhangaba - SP</option>
                <option value="Guaratinguetá">Guaratinguetá - SP</option>
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

          {autoDetectNotice && (
            <div className="p-2.5 bg-crimson-50 border border-crimson-200 rounded-xl text-xs font-bold text-crimson-800 flex items-center space-x-2 animate-fadeIn">
              <span>{autoDetectNotice}</span>
            </div>
          )}

          {/* Exemplos Rápidos com 1 Clique */}
          <div className="space-y-1.5 bg-neutral-50 p-3 rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              Testar com exemplos reais de cidades vizinhas:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => carregarExemploCidade('Jacareí')}
                className="py-1 px-3 rounded-lg bg-white hover:bg-crimson-50 hover:text-crimson-800 text-xs font-semibold border border-gray-200 shadow-2xs transition-colors"
              >
                🚌 Jacareí (Subsídio Tarifa Ônibus)
              </button>
              <button
                type="button"
                onClick={() => carregarExemploCidade('Caçapava')}
                className="py-1 px-3 rounded-lg bg-white hover:bg-crimson-50 hover:text-crimson-800 text-xs font-semibold border border-gray-200 shadow-2xs transition-colors"
              >
                🚧 Caçapava (Drenagem e Asfalto)
              </button>
              <button
                type="button"
                onClick={() => carregarExemploCidade('Taubaté')}
                className="py-1 px-3 rounded-lg bg-white hover:bg-crimson-50 hover:text-crimson-800 text-xs font-semibold border border-gray-200 shadow-2xs transition-colors"
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
                  ? 'border-crimson-600 text-crimson-800'
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
                  ? 'border-crimson-600 text-crimson-800'
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
                className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-crimson-500 focus:outline-none leading-relaxed"
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
                className="w-full p-8 border-2 border-dashed border-gray-300 hover:border-crimson-500 bg-gray-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all text-center space-y-2"
              >
                {manualPdfFile ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-crimson-600 mx-auto" />
                    <p className="text-xs font-bold text-gray-900">{manualPdfFile.name}</p>
                    <p className="text-[10px] text-gray-500">
                      Tamanho: {(manualPdfFile.size / 1024).toFixed(1)} KB • Pronto para leitura direta com a IA
                    </p>
                    {autoDetectNotice && (
                      <p className="text-[11px] font-bold text-crimson-700 bg-crimson-50 px-2 py-0.5 rounded-lg border border-crimson-200 inline-block mt-1">
                        {autoDetectNotice}
                      </p>
                    )}
                    <span className="text-[11px] text-crimson-600 underline font-semibold block pt-1">
                      Clique para trocar de arquivo
                    </span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-10 h-10 text-crimson-600" />
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

          {/* Aviso sobre o modo de processamento */}
          {!apiKey && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
              ⚙️ Sem chave Gemini configurada: o sistema processará o PDF através do <strong>Extrator Local Inteligente</strong> (lendo atos oficiais, contratos e secretarias direto do arquivo).
            </p>
          )}

          {/* Botão de Processar */}
          <Button
            variant="primary"
            onClick={handleProcessarManualComIA}
            isLoading={isProcessing}
            className="w-full py-3.5 rounded-xl font-bold bg-crimson-600 hover:bg-crimson-700 text-white text-xs flex items-center justify-center space-x-2 shadow-md"
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
                      <span className="text-[10px] bg-crimson-100 text-crimson-800 font-bold px-2 py-0.5 rounded-full">
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
                      <span className="text-crimson-600 font-bold">
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
      {/* ABA 4: MODERAÇÃO DE PETIÇÕES (QUÓRUM ATINGIDO)           */}
      {/* ======================================================== */}
      {activeTab === 'peticoes_mod' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center space-x-2">
                <Stamp className="w-5 h-5 text-crimson-600" />
                <h3 className="text-sm font-black text-gray-900">
                  Fila de Moderação de Petições Cívicas (Quórum Atingido)
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                Quando uma matéria da Câmara acumula <strong>50 discordâncias</strong> de moradores, a IA compila os argumentos e redige a minuta. O administrador humano revisa, corrige e aprova antes de disparar aos órgãos públicos.
              </p>
            </div>

            <span className="text-[11px] font-bold px-3 py-1 bg-crimson-50 text-crimson-800 rounded-full border border-crimson-200 self-start sm:self-auto">
              {peticoesFila.filter((p) => p.status === 'pendente_revisao').length} aguardando revisão
            </span>
          </div>

          <div className="space-y-5">
            {peticoesFila.map((peticao) => {
              const isPendente = peticao.status === 'pendente_revisao';
              const isAprovada = peticao.status === 'aprovada_enviada';

              return (
                <div
                  key={peticao.id}
                  className={`border rounded-2xl p-4 sm:p-5 space-y-4 transition-all ${
                    isPendente
                      ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                      : isAprovada
                      ? 'border-crimson-300 bg-crimson-50/10'
                      : 'border-gray-200 opacity-60'
                  }`}
                >
                  {/* Top Bar da Petição */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          isPendente
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : isAprovada
                            ? 'bg-crimson-100 text-crimson-800 border-crimson-300'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {isPendente
                          ? '⏳ Aguardando Curadoria Humana'
                          : isAprovada
                          ? '✅ Aprovada & Publicada em Ações'
                          : '📁 Arquivada'}
                      </span>

                      <span className="text-xs font-bold text-gray-700">
                        {peticao.bairro} • {peticao.cidade}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-gray-400">
                      Quórum batido: {peticao.dataQuorum}
                    </span>
                  </div>

                  {/* Título da Causa */}
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 leading-snug">
                      {peticao.titulo}
                    </h4>
                    <p className="text-xs text-crimson-700 font-bold mt-0.5">
                      Alvo: {peticao.vereadorAlvo}
                    </p>
                  </div>

                  {/* Dados de Quórum */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] font-semibold">Assinaturas de Oposição:</span>
                      <strong className="text-crimson-700 font-black text-sm">
                        {peticao.totalDiscordancias} cidadãos
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] font-semibold">Meta de Quórum:</span>
                      <strong className="text-gray-900 font-bold text-sm">
                        {peticao.quorumMinimo} votos (Atingido!)
                      </strong>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-gray-400 block text-[10px] font-semibold">Fundamentação:</span>
                      <strong className="text-gray-700 font-bold text-xs">
                        Art. 5º, XXXIV CF
                      </strong>
                    </div>
                  </div>

                  {/* Argumentos dos Moradores */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-800 block">
                      Motivos reais informados pelos moradores na votação:
                    </label>
                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200">
                      {peticao.argumentosMoradores.map((arg, idx) => (
                        <li key={idx} className="leading-relaxed">
                          &ldquo;{arg}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Minuta Formal da IA (Editável pelo Administrador) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 flex items-center space-x-1">
                        <FileText className="w-4 h-4 text-crimson-600" />
                        <span>Minuta Formal do Abaixo-Assinado (Editável pelo Administrador):</span>
                      </label>
                      <span className="text-[10px] text-gray-400">Pode ajustar o texto livremente</span>
                    </div>
                    <textarea
                      rows={3}
                      value={peticao.minutaIA}
                      disabled={!isPendente}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPeticoesFila((prev) =>
                          prev.map((p) => (p.id === peticao.id ? { ...p, minutaIA: val } : p))
                        );
                      }}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-sans text-gray-800 focus:ring-2 focus:ring-crimson-600 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* E-mail de Destino do Órgão / Vereador */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 block">
                        E-mail oficial para envio protocolar:
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={peticao.emailAlvo}
                          disabled={!isPendente}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPeticoesFila((prev) =>
                              prev.map((p) => (p.id === peticao.id ? { ...p, emailAlvo: val } : p))
                            );
                          }}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:ring-2 focus:ring-crimson-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Botões de Ação do Administrador */}
                    <div className="flex items-end space-x-2 pt-1">
                      {isPendente ? (
                        <>
                          <button
                            onClick={() => {
                              setPeticoesFila((prev) =>
                                prev.map((p) =>
                                  p.id === peticao.id ? { ...p, status: 'aprovada_enviada' } : p
                                )
                              );
                              setPublishSuccess(
                                `✅ Petição "${peticao.titulo}" foi APROVADA e publicada com sucesso na aba de Petições!`
                              );
                            }}
                            className="flex-1 py-2 px-3 bg-crimson-600 hover:bg-crimson-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 shadow-crimson-btn transition-transform active:scale-95 cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Aprovar Petição</span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Deseja arquivar esta petição?')) {
                                setPeticoesFila((prev) =>
                                  prev.map((p) =>
                                    p.id === peticao.id ? { ...p, status: 'rejeitada' } : p
                                  )
                                );
                              }
                            }}
                            className="py-2 px-3 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Arquivar
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center space-x-2 w-full">
                          <button
                            onClick={() => {
                              setPeticoesFila((prev) =>
                                prev.map((p) =>
                                  p.id === peticao.id ? { ...p, simulouEnvio: true } : p
                                )
                              );
                              alert(
                                `📧 Petição e lista de ${peticao.totalDiscordancias} assinaturas auditadas enviada com sucesso para ${peticao.emailAlvo} sob Protocolo Digital CBR-${Date.now().toString().slice(-6)}!`
                              );
                            }}
                            className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <SendHorizontal className="w-3.5 h-3.5" />
                            <span>
                              {peticao.simulouEnvio ? 'Reenviar E-mail Protocolar' : 'Disparar E-mail ao Gabinete'}
                            </span>
                          </button>

                          <Link
                            href="/acoes"
                            className="py-2 px-3 border border-crimson-200 bg-crimson-50 text-crimson-800 hover:bg-crimson-100 rounded-xl text-xs font-bold transition-colors"
                          >
                            Ver em Ações →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {peticoesFila.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400">
                Nenhuma petição com quórum aguardando moderação.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 5: CHAVE DA IA & PROMPTS                             */}
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
            <div className="p-3 bg-crimson-50 border border-crimson-300 text-crimson-800 rounded-xl text-xs font-bold animate-fadeIn">
              {statusMessage}
            </div>
          )}

          {/* Chave de API */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-crimson-600" />
                <span>Google Gemini API Key:</span>
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-crimson-600 hover:underline text-[11px] flex items-center space-x-1"
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
              className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-crimson-500 focus:outline-none leading-relaxed"
            />
          </div>

          <Button type="submit" variant="primary" className="py-3 px-6 font-bold bg-crimson-600 hover:bg-crimson-700 text-white rounded-xl">
            Salvar Configurações
          </Button>
        </form>
      )}
    </div>
  );
}
