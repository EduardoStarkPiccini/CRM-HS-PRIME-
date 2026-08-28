import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireGestor } from '@/lib/supabase/require-gestor';
import type { Database, Role, UserStatus } from '@/types/database.types';

export const runtime = 'nodejs';

/**
 * PATCH /api/team/:id
 * Edita nome/perfil/status/foto de um usuário existente, e usa a
 * service role para (des)bloquear o login no Supabase Auth quando o
 * status muda — sem nunca apagar leads, vendas, comissões ou histórico:
 * este endpoint só atualiza a linha em "profiles" e o registro de Auth,
 * nunca faz DELETE em nenhuma outra tabela.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireGestor();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = params;
  const form = await request.formData();
  const admin = createAdminClient();

  const update: Database['public']['Tables']['profiles']['Update'] = {};

  const nome = form.get('nome');
  if (typeof nome === 'string' && nome.trim()) update.full_name = nome.trim();

  const perfil = form.get('perfil');
  if (perfil === 'gestor' || perfil === 'vendedor') update.role = perfil as Role;

  const status = form.get('status');
  if (status === 'ativo' || status === 'inativo') {
    update.status = status as UserStatus;
    // Bloqueia (ou libera) o login no nível do Supabase Auth, além do
    // profile — dupla trava, não depende só da checagem da aplicação.
    await admin.auth.admin.updateUserById(id, {
      ban_duration: status === 'inativo' ? '876000h' : 'none',
    });
  }

  const foto = form.get('foto');
  if (foto instanceof File && foto.size > 0) {
    const ext = foto.name.split('.').pop() || 'jpg';
    const path = `${id}/avatar.${ext}`;
    const buffer = Buffer.from(await foto.arrayBuffer());
    const { error: uploadError } = await admin.storage.from('avatars').upload(path, buffer, {
      contentType: foto.type || 'image/jpeg',
      upsert: true,
    });
    if (!uploadError) {
      update.avatar_url = admin.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 });
  }

  const { error } = await admin.from('profiles').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

