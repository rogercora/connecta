# 🏛️ Cidadão Connect - Rede Social & Cidadania Geolocalizada

Plataforma WebApp (PWA / Mobile-First) e híbrida (Capacitor) para acompanhamento cívico hiperlocal, tradução de Diários Oficiais com IA, votação de projetos de lei comunitários e zeladoria urbana com protocolo automático.

---

## 📱 Estrutura e Identidade Visual (Mockup)

- **Header:** "Cidadão Connect" em tipografia marcante, com busca e mensagens integradas.
- **Abas Territoriais:** `Meu Bairro` (Hiperlocal por CEP) | `Minha Cidade` | `Brasil Federal`.
- **Card Alerta de IA:** 
  - Tag visual `🤖 RESUMO INTELIGENTE`
  - Campos: Votação/Resumo, Impacto no Bairro e Vereador Proponente
  - Voto auditado: `✅ CONCORDAR` e `❌ DISCORDAR` (com abertura de justificativa)
  - Botão de transparência: `[📄 Ver Diário Oficial Original]`
- **Post de Zeladoria Urbana:**
  - Identificação de morador verificado por CEP (ex: "Maria Silva (Moradora do Ipiranga) • Verificado")
  - Protocolo automático emitido sob o número da subprefeitura
  - Interações sociais: Curtidas, Comentários, Compartilhamento
- **Bottom Navigation Bar:** 
  - 5 ícones: `Home`, `Ações`, `Câmera` (botão central destacado em verde), `Mensagens`, `Perfil`.

---

## 🚀 Como Executar o Projeto

### 1. Instalar dependências
```bash
npm install
```

### 2. Rodar em ambiente de desenvolvimento
```bash
npm run dev
```
Acesse no navegador: `http://localhost:3000` (ou modo emulação mobile no DevTools `Ctrl+Shift+M`).

---

## 🗄️ Banco de Dados (Supabase + PostGIS)

Os scripts DDL completos estão disponíveis em:
- [schema.sql](file:///home/roger/Documentos/politicando/supabase/schema.sql): Tabelas `users`, `pautas_ia`, `posts_comunidade`, `votos_pauta`, `comentarios`, `peticoes`, triggers de contagem de votos, cálculo de quórum de abaixo-assinado e políticas de RLS.
- [seed.sql](file:///home/roger/Documentos/politicando/supabase/seed.sql): Dados mockados de demonstração (moradores do Ipiranga/SP, pauta de zoneamento da Rua Silva Bueno e buraco na via).

---

## 🤖 Pipeline de IA & Prompts
Localizado em [summarizer.ts](file:///home/roger/Documentos/politicando/src/prompts/summarizer.ts):
- `buildSummarizerPrompt`: Ingestão de texto bruto de Diários Oficiais e retorno em JSON estrito com resumo neutro, impacto estimado e autor proponente.
- `buildPeticaoPrompt`: Geração dinâmica de minuta de Abaixo-Assinado Digital quando há consenso popular no bairro.

---

## 🔐 Níveis de Acesso e Antifraude

| Nível | Identificação | Permissões |
|---|---|---|
| **Visitante** | Não autenticado | Leitura do feed público |
| **Nível 1** | E-mail + Telefone + CEP | Curtir, comentar e postar ocorrências de zeladoria |
| **Nível 2** | Comprovante de Residência / Selfie | Voto direto em leis e assinatura em petições públicas |

