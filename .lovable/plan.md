## Resumo das mudanças

Reestruturação grande da navegação, transformação do "Clube" em página de **Assinatura (combos mensais)**, renomeação do sistema XP para **Vantagens**, gate de login antes de adicionar ao carrinho, criação de admin fixo (`adminova@amendobento.com` / `adminova`), remoção total de emojis e nova página detalhada "Quem somos".

---

## 1. Navbar (`src/components/Nav.tsx`)

Antes: Início · Harmonização · Catálogo · Kits · Promoções · Clube (chip) · XP bar
Depois: **Início · Catálogo · Quem somos**

- Remover Harmonização, Kits, Promoções e o chip "Clube" da navbar.
- Remover a `XPBar` (a entrada para o sistema de vantagens passa a ser pelo menu do avatar).
- A página `/harmonizacao`, `/kits` e `/promocoes` continuam existindo (acessadas pela home e por dentro do catálogo).

## 2. Catálogo (`src/routes/catalog.tsx`)

Adicionar no topo do catálogo dois cards/atalhos:
- **Kits prontos** → `/kits`
- **Promoções** → `/promocoes`

Assim os dois itens removidos da navbar continuam descobertos.

## 3. Home (`src/routes/index.tsx`)

- **Remover** a seção "Vibe do dia / Qual a vibe de hoje?" inteira.
- **Mover Harmonização** para **logo abaixo de "Kits em destaque"**, como uma seção convidativa ("Descubra qual amendoim combina com sua bebida →" + alguns cards das vibes ou um CTA forte para `/harmonizacao`).
- Em "Quem somos" adicionar botão **"Ver mais sobre nós →"** que leva para `/quem-somos` (página nova; fotos serão adicionadas depois).
- Remover o banner de signup com emoji 🎁 (vira texto simples sem emoji).

## 4. Página nova: `/quem-somos` (`src/routes/quem-somos.tsx`)

Página dedicada com história expandida, valores, processo de torra, foto do logo e placeholders para fotos que a usuária mandará depois. Head/SEO próprio.

## 5. Clube → Assinatura (`src/routes/clube.tsx` reescrita)

Transformar a rota `/clube` em **página informativa de assinatura** com 3 combos mensais:

| Combo | Conteúdo | Preço |
|---|---|---|
| Degustação | 4 pacotes (1 de cada sabor) | abaixo da soma avulsa |
| FDS | 8 pacotes | abaixo da soma avulsa |
| Esporte | 12 pacotes | abaixo da soma avulsa |

Os preços serão calculados como ~15% abaixo da soma dos avulsos (placeholder editável depois). Cada card terá botão **"Quero assinar"** que abre um formulário simples (nome, e-mail, telefone, combo escolhido) gravando interesse na nova tabela `subscription_interests`.

**Banco** (via migration):
- Tabela `subscription_interests` (combo, nome, email, telefone, user_id opcional, status default `waitlist`).
- RLS: qualquer pessoa autenticada pode inserir o próprio interesse; admin lê tudo.

Em `/kit/$id` adicionar bloco no final: *"Gostou desses sabores? Assine o clube e receba muito mais →"* linkando para `/clube`.

## 6. XP → Vantagens

- Renomear toda a UI de "XP/Clube/Pontos" para **"Vantagens"** (mensagens, títulos, badges). O state interno (`xp`, `points`) fica como está para não quebrar o storage.
- Nova rota `/vantagens` (`src/routes/vantagens.tsx`) que contém o que hoje é `/clube` (nível, recompensas, missões), com as seguintes mudanças:
  - **Remover aba "Ranking"** completamente.
  - **Expandir Recompensas**: adicionar copo personalizado, camiseta, potinho de vidro, ecobag, boné, adesivos — junto com os cupons existentes.
  - Adicionar **bloco explicativo no topo** ("Como funcionam as Vantagens?") com 3 passos fáceis e ícones SVG (sem emoji): compre → acumule pontos → troque por recompensas.
- A rota antiga `/clube` agora é a página de assinatura (item 5). Atualizar todos os links internos que apontam para `/clube` no contexto de pontos/XP para `/vantagens`.

## 7. UserMenu (`src/components/UserMenu.tsx`)

Trocar itens do dropdown:
- ~~Meu perfil · Clube · Meu carrinho · Sair~~
- **Meu perfil · Vantagens · Sair**

Sem emojis nos itens.

## 8. Gate de login antes do carrinho

Hoje o gate só existe no checkout. Mudar para acontecer **na hora do "Adicionar ao carrinho"**:

- Criar helper `requireAuthOrRedirect()` em `src/lib/auth-guard.ts` que checa `supabase.auth.getUser()`; se não logado, navega para `/login?redirect=<url-atual>` e retorna `false`.
- Atualizar todos os pontos de adição ao carrinho (`store.addToCart`, botões "Comprar agora") em: `src/routes/index.tsx`, `catalog.tsx`, `produto.$id.tsx`, `kit.$id.tsx`, `kits.tsx`, `promocoes.tsx`, `harmonizacao_.resultado.tsx`. Cada botão chama o guard antes de adicionar.
- Em `/login`, após login bem-sucedido, redirecionar para `redirect` e mostrar toast "Pronto! Agora você pode adicionar ao carrinho."

## 9. Admin: usuário fixo `adminova`

- **Migration**: criar usuário `adminova@amendobento.com` via `auth.admin` não é possível em SQL puro, então usaremos uma migration que: (a) tenta criar via `auth.users` insert direto com senha `bcrypt('adminova')` usando `crypt()` da extensão `pgcrypto`; (b) atribui role `admin` em `public.user_roles`; (c) remove sua conta atual (e qualquer outra com role admin) das tabelas `profiles`, `user_roles` e `auth.users`.
- Confirmar email automaticamente (`email_confirmed_at = now()`).
- Resultado: só existe **um admin**, com login `adminova@amendobento.com` + senha `adminova`. Login normal pela tela `/login`.
- Aviso de segurança: senha fraca; recomendo trocar depois nas configurações.

## 10. Remover TODOS os emojis

Varredura em toda a `src/` removendo emojis de:
- Botões, títulos, banners, badges, navegação, toasts, mensagens do Mestre.
- Cards de sabores (`CATALOG[].emoji` em `src/lib/amendobento.ts`) — substituir por bolinhas coloridas (já existe `p.color`) e/ou ícones lucide.
- Vibes, níveis (`LEVELS[].emoji`), missões, recompensas, kits — trocar por ícones lucide-react (`Beer`, `Trophy`, `Gift`, `Star`, `Flame`, `Package`, `Coffee`, etc.) ou remover.
- Mensagens internas do `store.saySomething(...)`.

## 11. Detalhes técnicos

- Rotas novas: `src/routes/quem-somos.tsx`, `src/routes/vantagens.tsx`. A `routeTree.gen.ts` regenera sozinho.
- Rota `/clube` reaproveitada como assinatura (reescrita do componente, mesma URL).
- Migration nova: `subscription_interests` + GRANTs + RLS + criação/seed do admin `adminova` + delete dos admins antigos.
- Nenhum pagamento real será integrado nesta entrega (assinatura = waitlist informativa).
- Fotos do "Quem somos" ficam como placeholder até a usuária enviar.

## 12. Fora de escopo desta entrega

- Cobrança recorrente real do clube (Stripe) — só waitlist agora.
- Upload das fotos da página Quem somos (usuária enviará depois).
- Mudar a senha do admin para algo seguro (recomendado fazer no painel depois).
