import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

export interface PeticaoPdfInput {
  id: string;
  protocoloDigital: string;
  titulo: string;
  resumo?: string | null;
  minutaTexto: string;
  argumentos: string[];
  cidade: string;
  estado: string;
  bairro?: string | null;
  cepAlvo?: string | null;
  vereadorAlvo?: string | null;
  emailDestino?: string | null;
  totalAssinaturas: number;
  metaAssinaturas: number;
  status: string;
  createdAt?: string | null;
  fonteDiario?: string | null;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 46,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.48,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  headerBox: {
    borderBottomWidth: 2,
    borderBottomColor: '#be123c',
    paddingBottom: 12,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#be123c',
  },
  protocolTag: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  docTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subMeta: {
    fontSize: 9,
    color: '#475569',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
  },
  metaCol: {
    width: '50%',
    marginBottom: 6,
    paddingRight: 8,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#be123c',
    paddingLeft: 7,
  },
  bodyText: {
    fontSize: 10,
    color: '#1e293b',
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 6,
  },
  bulletDot: {
    width: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#be123c',
  },
  bulletContent: {
    flex: 1,
    fontSize: 9.8,
    color: '#1e293b',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 46,
    right: 46,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    fontSize: 8,
    color: '#64748b',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export async function renderPeticaoPdfBuffer(input: PeticaoPdfInput): Promise<Buffer> {
  const dataEmissao = new Date(input.createdAt || Date.now()).toLocaleDateString('pt-BR');
  const paragrafosMinuta = input.minutaTexto
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const doc = (
    <Document
      title={`Peticao ${input.protocoloDigital} - ${input.titulo}`}
      author="ConectaBr - Participação Cívica"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBox}>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>CONECTABR • PETIÇÃO CÍVICA OFICIAL</Text>
            <Text style={styles.protocolTag}>PROTOCOLO {input.protocoloDigital}</Text>
          </View>
          <Text style={styles.docTitle}>{input.titulo}</Text>
          <Text style={styles.subMeta}>
            Amparo legal: Direito de Petição — Art. 5º, XXXIV, alínea &quot;a&quot;, Constituição Federal de 1988
          </Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Município / Região</Text>
            <Text style={styles.metaValue}>
              {input.cidade}/{input.estado}
              {input.bairro ? ` • ${input.bairro}` : ''}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Adesões Únicas Auditadas</Text>
            <Text style={styles.metaValue}>
              {input.totalAssinaturas} cidadãos (meta municipal: {input.metaAssinaturas})
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Destinatário / Autoridade</Text>
            <Text style={styles.metaValue}>
              {input.vereadorAlvo || 'Câmara Municipal'}
              {input.emailDestino ? ` (${input.emailDestino})` : ''}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>CEP / Data de Referência</Text>
            <Text style={styles.metaValue}>
              {input.cepAlvo || 'Municipal'} • {dataEmissao}
            </Text>
          </View>
        </View>

        {input.resumo ? (
          <View>
            <Text style={styles.sectionTitle}>Síntese da Demanda Popular</Text>
            <Text style={styles.bodyText}>{input.resumo}</Text>
          </View>
        ) : null}

        {input.argumentos.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Argumentos Registrados pelos Moradores</Text>
            {input.argumentos.slice(0, 8).map((arg, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>{idx + 1}.</Text>
                <Text style={styles.bulletContent}>{arg}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View>
          <Text style={styles.sectionTitle}>Minuta Protocolar</Text>
          {paragrafosMinuta.map((p, idx) => (
            <Text key={idx} style={styles.bodyText}>
              {p}
            </Text>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text>
            ConectaBr • Registro único por conta autenticada e CEP validado ({input.cidade}/{input.estado})
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(doc);
}

