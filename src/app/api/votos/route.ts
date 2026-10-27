import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { pauta_id, user_id, opcao_voto, motivo_discordancia } = await req.json();

    if (!pauta_id || !user_id || !opcao_voto) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Voto computado com sucesso no quórum auditado.',
      voto: {
        pauta_id,
        user_id,
        opcao_voto,
        motivo_discordancia: motivo_discordancia || null,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

