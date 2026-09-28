# Alpha Gourmet — versão 2

Projeto preparado para Vercel + Supabase + Mercado Pago, com identidade visual Alpha Gourmet.

## O que foi ajustado
- Logo real enviada pelo cliente aplicada no cabeçalho, hero, favicon/PWA e rodapé.
- Cadastro/login de clientes via Supabase Auth.
- Histórico de pedidos com número, data, hora, plano e valor.
- Rastreamento por etapas: recebido → em preparação → pronto → saiu para entrega → entregue.
- Painel administrativo separado, protegido por autenticação e perfil `admin`.
- Atualização de status pelo administrador.
- Banco Supabase com pedidos, itens e histórico de status.
- API server-side para iniciar checkout do Mercado Pago sem expor access token no navegador.
- PWA instalável em Android e iPhone, sem necessidade de publicar na Play Store/App Store.
- Layout responsivo para desktop e celular.
- Modo prévia com localStorage quando Supabase ainda não estiver configurado.

## Configuração
1. Rode `supabase/schema.sql` no SQL Editor do Supabase.
2. Crie uma conta de cliente em `/`.
3. Promova o usuário administrador no Supabase:
   `update public.profiles set role='admin' where id='UUID_DO_USUARIO';`
4. No Vercel, configure as variáveis de ambiente do `.env.example`.
5. No `index.html`, substitua `SUPABASE_URL` e `SUPABASE_ANON_KEY` pelos dados públicos do projeto.
6. Configure `MERCADOPAGO_ACCESS_TOKEN` e `SITE_URL` no Vercel.
7. Faça redeploy.

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` ou `MERCADOPAGO_ACCESS_TOKEN` dentro do HTML.
