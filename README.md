# CRM HS PRIME

## Etapa 1 — Base e Arquitetura ✅
Next.js 14 + Supabase (Postgres, Storage, Backend) + identidade preto/dourado.
Tabelas: `profiles`, `leads`, `lead_history`, `lead_actions`, `sales`,
`commission_settings`, `loss_reasons`, todas com RLS.

## Etapa 2 — Autenticação, usuários e permissões ✅
Login com Supabase Auth, dois perfis (gestor/vendedor), criação segura do
primeiro gestor, tela **Equipe** para o gestor criar/editar/desativar
vendedores (com foto no Storage), e RLS reforçado para bloquear a área
administrativa de quem não é gestor.

## Etapa 3 — Leads, funil e próximas ações ✅
Cadastro de leads, funil Kanban (Lead → Qualificado → Vendido → Perdido),
histórico automático e manual, painel de Próximas Ações e filtro por mês/ano.

## Etapa 4 — Vendas e comissões ✅
Ao marcar um lead como VENDIDO, o sistema pede os dados da venda e calcula
a comissão automaticamente pela origem do carro (HS PRIME = R$ 900,
LOJA PARCEIRA = R$ 500, editável em Configurações). O valor é travado na
própria venda no momento do registro — mudar a regra depois nunca altera
vendas antigas. "Minhas Vendas" (vendedor) e a aba "Comissões" dentro do
dashboard (gestor, Etapa 5) mostram o resultado.

## Etapa 5 — Dashboard, gestão e relatórios ✅ (esta etapa)
"Meu Painel" (vendedor) e "Visão Geral" (gestor) com KPIs calculados
100% a partir do banco. No gestor: Ranking de vendedores (com foto),
Histórico Mensal + comparação entre os dois meses mais recentes,
resultado anual acumulado (basta escolher "Todos os meses" no filtro),
ledger de comissões e relatório de motivos de perda — tudo com filtros
combináveis de mês/ano, vendedor, origem do carro e origem do lead.


## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — identidade visual preto + dourado
- **Supabase** — Postgres, Auth, Storage e Backend
- **Vercel** — hospedagem

## Tabelas do banco (supabase/migrations)

| Tabela                | Finalidade                                                    |
|------------------------|----------------------------------------------------------------|
| `profiles`             | Vendedores e gestores (nome, perfil de acesso, status, foto)  |
| `leads`                 | Clientes/leads e sua etapa no funil                           |
| `lead_history`           | Linha do tempo de cada lead                                   |
| `lead_actions`            | Próximas ações (to-dos) por lead                              |
| `sales`                    | Vendas concluídas                                             |
| `commission_settings`       | Regras de comissão por vendedor                               |
| `loss_reasons`                | Motivo de perda de cada lead                                  |

Todas com **Row Level Security (RLS)**: vendedor só enxerga o que é seu;
gestor enxerga tudo. Bucket `avatars` no Storage já criado para as fotos
da equipe.

## Estrutura de pastas (Etapa 2 em destaque)

```
app/
  login/page.tsx                    Tela de login (e-mail + senha)
  setup/page.tsx                     Criação do primeiro gestor (com código secreto)
  (dashboard)/
    gestor/layout.tsx                 Guarda de rota: só gestor ativo passa
    gestor/page.tsx                    Dashboard do gestor
    gestor/equipe/page.tsx              Lista da equipe (Server Component + RLS)
    vendedor/layout.tsx                  Guarda de rota: só vendedor ativo passa
    vendedor/page.tsx                     Dashboard do vendedor
  api/
    setup/create-admin/route.ts            Cria o 1º gestor (service role, protegido por código)
    team/route.ts                           POST — cria vendedor/gestor (service role)
    team/[id]/route.ts                       PATCH — edita/ativa/desativa (service role)
    health/route.ts                           Mantido da Etapa 1 (checagem de conexão)
middleware.ts                                 Protege TODAS as rotas por sessão + perfil
components/
  auth/                                       Formulários de login, setup e botão de logout
  dashboard/header.tsx                         Cabeçalho dos dashboards
  team/                                         Lista da equipe + modal de criar/editar
lib/
  supabase/
    client.ts / server.ts / admin.ts            (Etapa 1) clientes browser/server/service-role
    middleware.ts                                Cliente Supabase usado dentro do middleware
    require-gestor.ts                             Confirma perfil de gestor a partir da sessão
```

## Como configurar

### 1. Criar o projeto no Supabase (se ainda não fez na Etapa 1)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copie a **Project URL**, a **anon public key** e a **service_role key**.

### 2. Rodar as migrations

No **SQL Editor** do Supabase, rode os arquivos de `supabase/migrations/`
**na ordem numérica dos nomes** — inclusive a nova desta etapa,
`20260101090011_profiles_insert_lockdown.sql`. Ou, com o Supabase CLI:

```bash
supabase link --project-ref <seu-project-ref>
supabase db push
```

### 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha as quatro:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SETUP_ADMIN_SECRET=
```

`SETUP_ADMIN_SECRET` é novo nesta etapa — gere um valor forte:

```bash
openssl rand -hex 24
```

Configure as mesmas quatro variáveis na Vercel antes do deploy.

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` nunca deve começar com `NEXT_PUBLIC_` nem
> ser importada em um Client Component — `lib/supabase/admin.ts` usa o
> pacote `server-only` para o build quebrar se isso acontecer por engano.

### 4. Instalar e rodar localmente

```bash
npm install
npm run dev
```

### 5. Criar o primeiro gestor

1. Acesse `http://localhost:3000/setup`.
2. Preencha nome, e-mail, senha e o código (`SETUP_ADMIN_SECRET`).
3. Você será redirecionado para `/login` — entre com esse e-mail/senha.
4. A rota `/setup` se recusa a criar um segundo gestor por esse caminho:
   depois disso, novos usuários só são criados dentro do painel, em **Equipe**.

### 6. Deploy na Vercel

Suba o projeto para um repositório Git, importe na Vercel, configure as
quatro variáveis de ambiente e faça o deploy — o Next.js é detectado
automaticamente.

## Como funciona a permissão (resumo)

- **Sessão inexistente** → qualquer rota redireciona para `/login`.
- **Perfil inativo** (desativado pelo gestor) → a sessão é encerrada e o
  login também é bloqueado no Supabase Auth (`ban_duration`), então nem
  uma sessão antiga nem uma nova tentativa de login funcionam.
- **Vendedor tentando acessar `/gestor/**`** (inclusive digitando a URL
  direto) → o `middleware.ts` intercepta antes da página renderizar e
  manda de volta para `/vendedor`. O layout de `/gestor` faz a mesma
  checagem de novo no servidor, como segunda camada de proteção.
- **RLS no banco**: mesmo que alguém chame a API do Supabase diretamente
  com a chave anon (sem passar pelo Next.js), as políticas de RLS
  garantem que um vendedor só lê/edita linhas onde `assigned_to`/`seller_id`
  é o próprio `auth.uid()` — a aplicação nunca é a única barreira.
- **Criação de usuários** sempre passa pela `service_role`, usada
  exclusivamente em rotas de servidor (`app/api/**`), nunca no navegador
  — por isso criar um vendedor não afeta a sessão do gestor logado.

## Desativar um vendedor

Em **Equipe → Desativar**: o `status` do profile vira `inativo` e o login
é bloqueado no Supabase Auth. **Nada é apagado** — leads, vendas,
comissões e histórico permanecem intactos no banco, vinculados ao `id`
do usuário (que nunca é removido, só bloqueado).

## Critério de "mês" usado nos relatórios

Todo relatório (Histórico Mensal, Ranking, Comissões, filtros combinados)
agrupa uma VENDA pelo mês de ENTRADA do lead que a originou — não pela
data em que a venda fechou. Isso mantém o mesmo critério estabelecido
desde a Etapa 3 (um lead nunca muda de "safra" mensal ao longo do funil)
e evita que o mesmo cliente apareça em meses diferentes dependendo da
métrica. Está documentado em `lib/dashboard/calc.ts`.

## O que NÃO foi feito nesta etapa (de propósito)

- Exportação de relatórios (PDF/Excel)
- Notificações automáticas (e-mail/WhatsApp)
- Metas por vendedor

Combine comigo os próximos passos quando quiser seguir.
