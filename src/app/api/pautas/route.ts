import { NextResponse } from 'next/server';
import { INITIAL_PAUTA } from '@/stores/feedStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cep = searchParams.get('cep');

  return NextResponse.json({
    pautas: [INITIAL_PAUTA],
    cep_filtrado: cep || 'geral',
  });
}

