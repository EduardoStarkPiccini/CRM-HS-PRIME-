import { redirect } from 'next/navigation';

/**
 * A raiz do site nunca renderiza nada por si só: o middleware.ts já
 * intercepta "/" e redireciona para /login, /gestor ou /vendedor
 * conforme a sessão. Este redirect aqui é só uma rede de segurança.
 */
export default function RootPage() {
  redirect('/login');
}
