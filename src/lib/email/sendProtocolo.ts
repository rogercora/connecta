export interface SendProtocoloEmailInput {
  to: string;
  subject: string;
  protocoloDigital: string;
  tituloPeticao: string;
  cidade: string;
  estado: string;
  totalAssinaturas: number;
  minutaTexto: string;
  pdfBuffer: Buffer;
}

export interface SendProtocoloEmailResult {
  sent: boolean;
  provider: 'resend' | 'simulado';
  messageId?: string;
  notice: string;
}

export async function sendProtocoloEmail(
  input: SendProtocoloEmailInput
): Promise<SendProtocoloEmailResult> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const fromAddress =
    (process.env.RESEND_FROM_EMAIL || '').trim() || 'ConectaBr Protocolo <onboarding@resend.dev>';

  if (!apiKey) {
    return {
      sent: false,
      provider: 'simulado',
      notice:
        'RESEND_API_KEY não configurada na Vercel. Protocolo registrado no banco e PDF gerado com sucesso (modo simulação de envio).',
    };
  }

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5; max-width: 640px;">
        <h2 style="color: #be123c; margin-bottom: 4px;">ConectaBr — Protocolo Cívico Oficial</h2>
        <p style="font-size: 13px; color: #475569; margin-top: 0;">
          Protocolo <strong>${input.protocoloDigital}</strong> • ${input.cidade}/${input.estado}
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p><strong>Assunto:</strong> ${input.tituloPeticao}</p>
        <p><strong>Assinaturas únicas registradas:</strong> ${input.totalAssinaturas} moradores</p>
        <p><strong>Base legal:</strong> Direito de Petição — Art. 5º, XXXIV, "a" da Constituição Federal de 1988.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; white-space: pre-wrap; font-size: 13px;">${input.minutaTexto}</div>
        <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
          O documento completo em PDF segue em anexo para autuação formal e eventual resposta institucional.
        </p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [input.to],
        subject: input.subject,
        html,
        attachments: [
          {
            filename: `${input.protocoloDigital}.pdf`,
            content: input.pdfBuffer.toString('base64'),
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        sent: false,
        provider: 'resend',
        notice: `Falha no Resend (${response.status}): ${body?.message || 'verifique domínio/remetente'}. Protocolo salvo localmente.`,
      };
    }

    return {
      sent: true,
      provider: 'resend',
      messageId: body?.id,
      notice: `E-mail protocolar enviado via Resend para ${input.to}.`,
    };
  } catch (err: any) {
    return {
      sent: false,
      provider: 'resend',
      notice: `Erro de rede ao enviar via Resend: ${err?.message || 'timeout'}. Protocolo mantido no sistema.`,
    };
  }
}

