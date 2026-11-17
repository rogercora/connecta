import { NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { formatCEP } from '@/lib/utils/formatters';

function isValidAvatarUrl(rawUrl: unknown, userId: string): boolean {
  if (rawUrl === null) return true;
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;

  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return false;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const supabaseHost = new URL(supabaseUrl).hostname.toLowerCase();
      if (parsed.hostname.toLowerCase() !== supabaseHost) return false;
      if (!parsed.pathname.includes(`/storage/v1/object/public/avatars/${userId}/`)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const updates: Record<string, any> = {};

    if (body.nome_completo !== undefined) {
      if (typeof body.nome_completo !== 'string' || body.nome_completo.trim().length < 2) {
        return NextResponse.json(
          { error: 'Informe um nome completo válido (mínimo 2 caracteres).' },
          { status: 400 }
        );
      }
      updates.nome_completo = body.nome_completo.trim().slice(0, 120);
    }

    if (body.phone !== undefined) {
      if (body.phone === null || body.phone === '') {
        updates.phone = null;
      } else {
        const digits = String(body.phone).replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11) {
          return NextResponse.json(
            { error: 'Informe um celular válido com DDD (10 ou 11 dígitos).' },
            { status: 400 }
          );
        }
        updates.phone = digits;
      }
    }

    if (body.cep !== undefined) {
      const cepDigits = String(body.cep).replace(/\D/g, '');
      if (cepDigits.length !== 8) {
        return NextResponse.json(
          { error: 'Informe um CEP válido com 8 dígitos.' },
          { status: 400 }
        );
      }
      updates.cep = formatCEP(cepDigits);
    }

    if (body.bairro !== undefined) {
      if (typeof body.bairro !== 'string' || !body.bairro.trim()) {
        return NextResponse.json({ error: 'Informe o bairro.' }, { status: 400 });
      }
      updates.bairro = body.bairro.trim().slice(0, 120);
    }

    if (body.cidade !== undefined) {
      if (typeof body.cidade !== 'string' || !body.cidade.trim()) {
        return NextResponse.json({ error: 'Informe a cidade.' }, { status: 400 });
      }
      updates.cidade = body.cidade.trim().slice(0, 120);
    }

    if (body.estado !== undefined) {
      const uf = String(body.estado).trim().toUpperCase().slice(0, 2);
      if (uf.length !== 2) {
        return NextResponse.json({ error: 'UF inválida.' }, { status: 400 });
      }
      updates.estado = uf;
    }

    if (body.avatar_url !== undefined) {
      if (!isValidAvatarUrl(body.avatar_url, auth.authUser.id)) {
        return NextResponse.json(
          { error: 'URL da foto de perfil inválida.' },
          { status: 400 }
        );
      }
      updates.avatar_url = body.avatar_url;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado informado para atualização.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', auth.authUser.id)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505' && error.message.toLowerCase().includes('phone')) {
        return NextResponse.json(
          { error: 'Este número de celular já está vinculado a outra conta.' },
          { status: 409 }
        );
      }
      console.error('Erro ao atualizar perfil:', error.message);
      return NextResponse.json(
        { error: 'Não foi possível salvar as alterações do perfil.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error: any) {
    console.error('Erro em PATCH /api/perfil:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao atualizar perfil.' }, { status: 500 });
  }
}

