# Portal Atlas Terra — Guia de Configuração e Deploy

## Visão Geral

Portal privado para entrega de materiais técnicos da Atlas Terra aos seus clientes.
Stack: Next.js 14 · TypeScript · Tailwind CSS · Supabase · Vercel

---

## 1. Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita ou paga)
- Conta no [Vercel](https://vercel.com)
- Conta no [GitHub](https://github.com)

---

## 2. Configuração do Supabase

### 2.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL do projeto** e as chaves **anon** e **service_role**

### 2.2 Executar a migration SQL

1. No painel do Supabase, acesse **SQL Editor**
2. Cole e execute o conteúdo de `supabase/migrations/001_initial.sql`
3. Verifique se todas as tabelas foram criadas em **Table Editor**

### 2.3 Configurar autenticação

1. Vá em **Authentication > Settings**
2. Desabilite "Enable email confirmations" (o admin cria os usuários diretamente)
3. Em **URL Configuration**, adicione suas URLs de produção:
   - Site URL: `https://seu-dominio.vercel.app`
   - Redirect URLs: `https://seu-dominio.vercel.app/**`

### 2.4 Criar o primeiro administrador

Após configurar o projeto, crie o admin via SQL Editor:

```sql
-- 1. Primeiro crie o usuário no Auth via dashboard do Supabase
--    Authentication > Users > Add user
--    Email: admin@atlasterra.portal
--    Password: (senha segura)

-- 2. Depois execute este SQL com o auth_user_id gerado:
INSERT INTO public.profiles (auth_user_id, name, username, role, status)
VALUES (
  'COLE_AQUI_O_AUTH_USER_ID',
  'Administrador',
  'admin',
  'admin',
  'active'
);
```

---

## 3. Configuração local

### 3.1 Clonar e instalar

```bash
git clone https://github.com/seu-usuario/portal-atlas-terra.git
cd portal-atlas-terra
npm install
```

### 3.2 Variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
INTERNAL_EMAIL_DOMAIN=atlasterra.portal
```

> ⚠️ **NUNCA** commite o `.env.local` no Git. Ele já está no `.gitignore`.

### 3.3 Rodar localmente

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 4. Logo oficial

O arquivo `public/logo.svg` contém um placeholder visual da Atlas Terra.
**Substitua pelo arquivo oficial da logo** antes do deploy em produção.
O SVG deve ter fundo transparente e funcionar sobre fundos escuros.

---

## 5. Deploy na Vercel

### 5.1 Via GitHub (recomendado)

1. Faça push do projeto para um repositório GitHub (pode ser privado)
2. Acesse [vercel.com](https://vercel.com) > "New Project"
3. Importe o repositório
4. Configure as variáveis de ambiente:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (secreta) |
| `INTERNAL_EMAIL_DOMAIN` | `atlasterra.portal` |

5. Clique em **Deploy**

### 5.2 Domínio personalizado

Após o deploy:
1. Em Vercel > Project > Settings > Domains
2. Adicione `portal.atlasterra.com.br` (subdomínio recomendado)
3. Configure o DNS conforme instruções da Vercel

---

## 6. Estrutura de arquivos

```
portal-atlas-terra/
├── public/
│   └── logo.svg                    ← Substituir pela logo oficial
├── src/
│   ├── app/
│   │   ├── login/page.tsx          ← Tela de login
│   │   ├── admin/                  ← Área administrativa
│   │   │   ├── page.tsx            ← Dashboard
│   │   │   ├── clients/            ← CRUD de clientes
│   │   │   └── farms/              ← CRUD + gerenciamento de fazendas
│   │   ├── client/                 ← Área do cliente
│   │   │   ├── page.tsx            ← Cards de fazendas
│   │   │   └── farms/[id]/         ← Página da fazenda com abas
│   │   └── api/admin/              ← APIs server-side (usa service_role)
│   ├── components/
│   │   ├── admin/                  ← Layout, sidebar, componentes admin
│   │   ├── client/                 ← Header do cliente
│   │   └── shared/                 ← Toast, Modal, EmptyState, Loading
│   ├── lib/
│   │   ├── supabase/               ← Clients browser/server/middleware
│   │   └── utils.ts                ← Formatadores e helpers
│   └── types/index.ts              ← Todos os tipos TypeScript
├── supabase/
│   └── migrations/001_initial.sql  ← Schema completo + RLS + Storage
├── middleware.ts                   ← Proteção de rotas
├── .env.local.example              ← Template de variáveis
└── vercel.json                     ← Config de deploy
```

---

## 7. Como usar — Fluxo do Administrador

1. **Login** em `/login` com username `admin`
2. **Criar cliente**: Clientes → Novo Cliente → (nome, username, senha)
3. **Criar fazenda**: Fazendas → Nova Fazenda → vincular ao cliente
4. **Gerenciar materiais**: Fazendas → clique em "Gerenciar" na fazenda
   - Aba *Modelo 3D*: colar URL do Cesium Ion
   - Aba *Modelo 2D*: colar URL do Cesium Ion
   - Aba *Quadro de Áreas*: adicionar linhas com classes e áreas
   - Aba *Documentação*: preencher números + enviar PDFs
   - Aba *Imagens e Vídeos*: upload de imagens + links de YouTube
   - Aba *PDFs Técnicos*: upload de mapas e relatórios

---

## 8. Segurança — Checklist

- [x] SERVICE_ROLE_KEY nunca exposta no frontend
- [x] RLS habilitado em todas as tabelas
- [x] Clientes só acessam dados vinculados ao seu `client_id`
- [x] Buckets de storage privados (`farm-images`, `farm-documents`)
- [x] URLs assinadas temporárias (1h) para visualização/download
- [x] Middleware protege todas as rotas `/admin/*` e `/client/*`
- [x] Login com username (email interno nunca visível ao usuário)
- [x] Headers de segurança configurados no `next.config.ts`
- [x] `robots.txt` configurado com `noindex, nofollow`

---

## 9. Personalização futura

- **Logo**: substituir `public/logo.svg`
- **Cores**: editar `tailwind.config.ts` → `colors.atlas`
- **Fontes**: editar `src/app/globals.css`
- **Mapa interativo**: a arquitetura já prevê substituição do iframe Cesium por Leaflet/MapLibre na aba Modelo 2D
- **Imagens de capa**: implementar visualização real das imagens do bucket Supabase nos cards de fazenda

---

## Suporte

Em caso de dúvidas sobre configuração, consulte:
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
