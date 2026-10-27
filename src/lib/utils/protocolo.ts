/**
 * Gera um número de protocolo formal simulado no padrão de zeladoria pública.
 * Exemplo: 12345 ou CTN-2026-08492
 */
export function gerarNumeroProtocolo(): string {
  // Número simples e legível de 5 dígitos para exibição rápida no feed
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export function gerarProtocoloOficial(): string {
  const ano = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CTN-${ano}-${random}`;
}

