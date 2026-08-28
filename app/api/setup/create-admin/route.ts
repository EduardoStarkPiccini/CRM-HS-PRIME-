import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

/**
 * POST /api/setup/create-admin
 *
 * Cria o PRIMEIRO gestor do CRM HS PRIME. Só funciona se:
 *   1. o código enviado bater com SETUP_ADMIN_SECRET (variável de ambiente,
 *      nunca fica no frontend); e
 *   2. ainda não existir nenhum gestor cadastrado no banco.
 *
 * Depois que o primeiro gestor existe, esta rota se recusa a criar outro
 * — novos vendedores/gestores passam a ser criados pelo painel (/api/team),
 * já autenticado como gestor.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, senha, codigo } = body as {
      nome?: string; email?: string; senha?: string; codigo?: string;
    };

    if (!nome || !email || !senha || !codigo) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }
    if (senha.length < 8) {
      return NextResponse.json({ error: 'A senha precisa ter ao menos 8 caracteres.' }, { status: 400 });
    }
    if (codigo !== env.SETUP_ADMIN_SECRET()) {
      return NextResponse.json({ error: 'Código de configuração inválido.' }, { status: 403 });
    }

    const admin = createAdminClient();

    const { count, error: countError } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'gestor');

    if (countError) {
      return NextResponse.json({ error: 'Erro ao verificar gestores existentes.' }, { status: 500 });
    }
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Já existe um gestor cadastrado. Peça para um gestor te criar em Equipe.' },
        { status: 409 }
      );
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message ?? 'Não foi possível criar o usuário.' },
        { status: 400 }
      );
    }

    const { error: profileError } = await admin.from('profiles').insert({
      id: created.user.id,
      full_name: nome,
      role: 'gestor',
      status: 'ativo',
    });

    if (profileError) {
      // Reverte a criação do usuário de autenticação para não deixar órfão.
      await admin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro inesperado ao criar o gestor.' }, { status: 500 });
  }
}
