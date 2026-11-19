import { NextResponse } from 'next/server';
import { requireAdminUser, requireSuperAdminUser } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { formatCEP } from '@/lib/utils/formatters';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// GET: Lista cidadãos cadastrados (sem cpf_hash) e status das chaves de servidor
export async function GET() {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const serverConfig = {
      geminiConfigured: Boolean((process.env.GEMINI_API_KEY || '').trim()),
      cronSecretConfigured: Boolean((process.env.CRON_SECRET || '').trim()),
      serviceRoleConfigured: Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()),
      resendConfigured: Boolean((process.env.RESEND_API_KEY || '').trim()),
    };

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, nome_completo, email, phone, cep, bairro, cidade, estado, nivel_verificacao, role, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erro ao listar cidadãos via supabaseAdmin:', error.message);
        return NextResponse.json({
          cidadaos: [],
          currentAdminId: auth.authUser.id,
          currentUserRole: auth.profile?.role ?? 'admin',
          adminDbError: `Erro no Supabase ao consultar cidadãos: ${error.message}`,
          serverConfig,
        });
      }

      return NextResponse.json({
        cidadaos: data ?? [],
        currentAdminId: auth.authUser.id,
        currentUserRole: auth.profile?.role ?? 'admin',
        adminDbError: null,
        serverConfig,
      });
    } catch (adminErr: any) {
      console.error('Exceção ao inicializar getSupabaseAdmin:', adminErr?.message);
      return NextResponse.json({
        cidadaos: [],
        currentAdminId: auth.authUser.id,
        currentUserRole: auth.profile?.role ?? 'admin',
        adminDbError: adminErr?.message || 'Falha na configuração de SUPABASE_SERVICE_ROLE_KEY.',
        serverConfig,
      });
    }
  } catch (error: any) {
    console.error('Erro em GET /api/admin/cidadaos:', error?.message);
    return NextResponse.json({ error: error?.message || 'Erro interno no painel admin.' }, { status: 500 });
  }
}

// POST: Cria diretamente um novo Administrador (exclusivo Super Admin)
export async function POST(req: Request) {
  try {
    const auth = await requireSuperAdminUser();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      nome_completo,
      email,
      password,
      phone = '',
      cep = '12246-021',
      bairro = 'Jardim Aquárius',
      cidade = 'São José dos Campos',
      estado = 'SP',
      role = 'admin',
      nivel_verificacao = 2,
    } = body ?? {};

    if (typeof nome_completo !== 'string' || nome_completo.trim().length < 2) {
      return NextResponse.json({ error: 'Informe o nome completo.' }, { status: 400 });
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'A senha provisória deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }
    if (role !== 'cidadao' && role !== 'admin') {
      return NextResponse.json({ error: 'Papel inválido.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = String(phone || '').replace(/\D/g, '') || null;
    const cleanCepDigits = String(cep || '12246021').replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
    const formattedCep = formatCEP(cleanCepDigits);
    const cleanEstado = String(estado || 'SP').trim().toUpperCase().slice(0, 2) || 'SP';
    const nivelFinal = nivel_verificacao === 1 ? 1 : 2;

    const supabaseAdmin = getSupabaseAdmin();

    const { data: createdAuth, error: authCreateErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        nome_completo: nome_completo.trim(),
        phone: cleanPhone || '',
        cep: formattedCep,
        bairro: String(bairro || 'Centro').trim(),
        cidade: String(cidade || 'São José dos Campos').trim(),
        estado: cleanEstado,
      },
    });

    if (authCreateErr || !createdAuth?.user) {
      const msg = authCreateErr?.message?.toLowerCase().includes('already')
        ? 'Já existe uma conta cadastrada com este e-mail.'
        : authCreateErr?.message || 'Não foi possível criar o usuário no Supabase Auth.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { data: userRow, error: upsertErr } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          id: createdAuth.user.id,
          email: cleanEmail,
          phone: cleanPhone,
          nome_completo: nome_completo.trim().slice(0, 120),
          cep: formattedCep,
          bairro: String(bairro || 'Centro').trim().slice(0, 120),
          cidade: String(cidade || 'São José dos Campos').trim().slice(0, 120),
          estado: cleanEstado,
          role,
          nivel_verificacao: nivelFinal,
        },
        { onConflict: 'id' }
      )
      .select('id, nome_completo, email, phone, cep, bairro, cidade, estado, nivel_verificacao, role, created_at')
      .single();

    if (upsertErr || !userRow) {
      console.error('Erro ao gravar perfil de admin:', upsertErr?.message);
      return NextResponse.json(
        { error: 'Conta criada no Auth, mas houve falha ao salvar dados em public.users.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: userRow });
  } catch (error: any) {
    console.error('Erro em POST /api/admin/cidadaos:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao criar administrador.' }, { status: 500 });
  }
}

// PATCH: Atualiza nivel_verificacao (1/2) e/ou papel role ('cidadao'/'admin')
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const { user_id, nivel_verificacao, role } = await req.json();

    if (!user_id || typeof user_id !== 'string' || !UUID_REGEX.test(user_id)) {
      return NextResponse.json({ error: 'ID de usuário inválido.' }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (nivel_verificacao !== undefined) {
      if (nivel_verificacao !== 1 && nivel_verificacao !== 2) {
        return NextResponse.json(
          { error: 'Nível de verificação inválido. Utilize 1 ou 2.' },
          { status: 400 }
        );
      }
      updates.nivel_verificacao = nivel_verificacao;
    }

    if (role !== undefined) {
      if (auth.profile?.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Apenas o Super Admin pode promover ou rebaixar administradores.' },
          { status: 403 }
        );
      }
      if (role !== 'cidadao' && role !== 'admin') {
        return NextResponse.json(
          { error: 'Papel inválido. Utilize cidadao ou admin.' },
          { status: 400 }
        );
      }
      if (user_id === auth.authUser.id) {
        return NextResponse.json(
          { error: 'Você não pode alterar o próprio papel de Super Admin pelo painel.' },
          { status: 400 }
        );
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Informe nivel_verificacao ou role para atualizar.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (role !== undefined) {
      const { data: targetUser } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user_id)
        .maybeSingle();

      if (targetUser?.role === 'super_admin') {
        return NextResponse.json(
          { error: 'Não é permitido alterar o papel de um Super Admin.' },
          { status: 403 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user_id)
      .select('id, nome_completo, email, nivel_verificacao, role')
      .single();

    if (error || !data) {
      console.error('Erro ao atualizar usuário no admin:', error?.message);
      return NextResponse.json(
        { error: 'Não foi possível atualizar o usuário.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error: any) {
    console.error('Erro em PATCH /api/admin/cidadaos:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao atualizar usuário.' }, { status: 500 });
  }
}
