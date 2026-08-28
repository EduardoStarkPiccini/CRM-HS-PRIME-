import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

/**
 * Guarda de rotas do CRM HS PRIME.
 *
 * - Sem sessão -> redireciona para /login (exceto páginas públicas).
 * - Sessão com perfil inativo -> desloga e manda para /login.
 * - /gestor/**   só para role = 'gestor'.
 * - /vendedor/** só para role = 'vendedor'.
 * - "/" redireciona para o dashboard correto conforme o perfil.
 *
 * Isso garante que um vendedor NÃO acessa a área administrativa
 * simplesmente digitando a URL: mesmo que ele force /gestor/equipe,
 * o middleware intercepta antes da página renderizar.
 */

const PUBLIC_PATHS = ['/login', '/setup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, getResponse } = createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!user) {
    if (isPublic) return getResponse();
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Usuário autenticado no Supabase Auth — busca o perfil correspondente.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status !== 'ativo') {
    // Perfil inativo (desativado pelo gestor) ou inexistente: encerra a sessão.
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('erro', 'inativo');
    return NextResponse.redirect(url);
  }

  const home = profile.role === 'gestor' ? '/gestor' : '/vendedor';

  if (pathname === '/' || isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/gestor') && profile.role !== 'gestor') {
    const url = request.nextUrl.clone();
    url.pathname = '/vendedor';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/vendedor') && profile.role !== 'vendedor') {
    const url = request.nextUrl.clone();
    url.pathname = '/gestor';
    return NextResponse.redirect(url);
  }

  return getResponse();
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, exceto:
     * - arquivos estáticos do Next (_next/static, _next/image)
     * - favicon
     * - rotas de API (cada rota faz sua própria checagem de permissão)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
