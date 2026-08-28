import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireGestor } from '@/lib/supabase/require-gestor';

export const runtime = 'nodejs';

/**
 * POST /api/team
 * Cria um novo usuário (vendedor ou gestor) direto no Supabase Auth
 * e o profile correspondente. Usa a service role — por isso essa
 * lógica só pode viver aqui no servidor, nunca no browser.
 *
 * Como a criação acontece com o cliente admin (independente da sessão
 * do navegador), a sessão do gestor que está logado não é afetada.
 */
export async function POST(request: NextRequest) {
  const guard = await requireGestor();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const form = await request.formData();
  const nome = String(form.get('nome') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const senha = String(form.get('senha') ?? '');
  const perfil = form.get('perfil') === 'gestor' ? 'gestor' : 'vendedor';
  const status = form.get('status') === 'inativo' ? 'inativo' : 'ativo';
  const foto = form.get('foto');

  if (!nome || !email || senha.length < 8) {
    return NextResponse.json({ error: 'Preencha nome, e-mail e uma senha com ao menos 8 caracteres.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? 'Não foi possível criar o usuário.' }, { status: 400 });
  }

  let avatarUrl: string | null = null;
  if (foto instanceof File && foto.size > 0) {
    avatarUrl = await uploadAvatar(created.user.id, foto);
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: created.user.id,
    full_name: nome,
    role: perfil,
    status,
    avatar_url: avatarUrl,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (status === 'inativo') {
    await admin.auth.admin.updateUserById(created.user.id, { ban_duration: '876000h' });
  }

  return NextResponse.json({ ok: true, id: created.user.id });
}

async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const admin = createAdminClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from('avatars').upload(path, buffer, {
    contentType: file.type || 'image/jpeg',
    upsert: true,
  });
  if (error) return null;

  const { data } = admin.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
