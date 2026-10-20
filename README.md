# Liberdade Avança

Site do movimento Liberdade Avança. Next.js (App Router), Contentful para o blog e o manifesto, e um feed do X na página inicial.

## Desenvolvimento

```bash
npm install
npm run dev
```

A aplicação fica em [http://localhost:3000](http://localhost:3000).

```bash
npm test
npx biome ci .
npx tsc --noEmit
npm run build
```

## Variáveis de ambiente

Copia `.env.example` para `.env.local`. Na Vercel usa as mesmas chaves. Não faças commit de segredos.

| Variável | Função |
| --- | --- |
| `CONTENTFUL_SPACE_ID` | Id do espaço Contentful |
| `CONTENTFUL_API_BASE_URL` | Só Delivery: `https://cdn.contentful.com` (ou Preview: `https://preview.contentful.com`). Nunca `api.contentful.com` |
| `CONTENTFUL_API_ACCESS_TOKEN` | Token de **Content Delivery** (ou Preview) — não é o token de Management (CMA) |
| `CONTENTFUL_ENVIRONMENT` | Ambiente do espaço. Por defeito `master`. Letras, números, `_` e `-` |
| `CONTENTFUL_LOCALE` | Locale opcional dos pedidos à Delivery API (por defeito `en-US`, BCP 47). A língua da interface é `pt-PT` |
| `CONTENTFUL_WEBHOOK_SIGNING_SECRET` | Segredo HMAC do webhook ao nível do espaço (Settings → Webhooks → Settings). **Obrigatório na Production e na Preview da Vercel**; opcional em desenvolvimento local. Dois segredos separados por vírgula durante a rotação |
| `REVALIDATE_SECRET` | Segredo partilhado do webhook de revalidação |
| `SITE_URL` | Origem pública em `https`, sem caminho. Por defeito `https://liberdadeavanca.vercel.app`. Usada no `robots.txt`, no sitemap e em `metadataBase` |
| `ACCOUNT_MAIL` | Endereço do ícone de correio (`mailto`) |
| `SOCIAL_DATA_X_ACCOUNT` | Conta X/Twitter do feed da página inicial. As respostas ficam em cache 60 segundos |
| `SOCIAL_DATA_BASE_URL` | Host da SocialData — só `https://api.socialdata.tools` (lista de permissão) |
| `SOCIAL_DATA_API_KEY` | Chave da API SocialData |

### Rotação de segredos

Se um segredo pode ter vazado (conversa, logs, URL antiga do webhook com `?secret=`), roda-o:

1. **`REVALIDATE_SECRET`** — gera um valor novo, actualiza a Vercel (Production e Preview), actualiza o cabeçalho do webhook no Contentful e tira qualquer segredo antigo da query string.
2. **`CONTENTFUL_WEBHOOK_SIGNING_SECRET`** — no Contentful, Webhooks → Settings, roda o segredo de assinatura; mantém o antigo e o novo na Vercel (separados por vírgula) até o Contentful assinar só com o novo; depois remove o antigo.
3. **`CONTENTFUL_API_ACCESS_TOKEN`** — cria um token novo da Delivery API, põe-no na Vercel e no `.env.local`, e revoga o antigo.
4. **`SOCIAL_DATA_API_KEY`** — gera uma chave nova na SocialData, actualiza a Vercel e o `.env.local`, e revoga a antiga.

Faz um novo deploy depois de mudar variáveis na Vercel.

## Webhook de publicação do Contentful

As páginas do blog guardam os pedidos ao Contentful durante 60 segundos e também aceitam revalidação a pedido.

1. Define `REVALIDATE_SECRET` na Vercel (Production e Preview).
2. No Contentful: **Settings → Webhooks → Add webhook**.
3. URL: `https://<o-teu-domínio>/api/revalidate` (sem segredo na URL).
4. Cabeçalho: `x-revalidate-secret` = `<REVALIDATE_SECRET>`  
   (ou `Authorization: Bearer <REVALIDATE_SECRET>`).
5. Método: só **POST**. Gatilhos: Entry **Publish**, **Unpublish** e **Delete** (tipos `blogPost` e `manifesto`). Tag **Create**, **Save** e **Delete** são opcionais: actualizam de imediato o nome de uma etiqueta. Sem eles, o nome novo aparece na mesma dentro de 60 segundos.
6. Em caso de sucesso a rota revalida `/blog`, as listagens `/blog/tag/[tagId]` e, quando o corpo traz um id de entrada válido, `/blog/[postId]`. Publicações do manifesto revalidam `/manifesto`. Eventos de etiqueta também revalidam cada página `/blog/[postId]`.

O corpo do pedido está limitado a 64 KB. Acima disso a rota responde **413**. As respostas de erro são genéricas; o motivo fica só nos logs.

### Verificação do pedido (HMAC)

**Obrigatória na Production e na Preview da Vercel.** Prova que o POST foi assinado pelo Contentful para este espaço.
Sem `CONTENTFUL_WEBHOOK_SIGNING_SECRET`, os ambientes publicados respondem **500** (falha fechada). A mensagem não revela o nome da variável.
Em desenvolvimento local podes omitir o segredo de assinatura e ficar só com o `REVALIDATE_SECRET`.

1. Contentful: **Settings → Webhooks → Settings → Enable request verification**.
2. Copia o segredo de 64 caracteres (só é mostrado uma vez).
3. Vercel: define `CONTENTFUL_WEBHOOK_SIGNING_SECRET` em **Production e Preview** e faz deploy.
4. Com a variável definida, `/api/revalidate` exige `x-contentful-signature`, `x-contentful-signed-headers` e `x-contentful-timestamp` válidos (janela de 60 segundos para trás e para a frente, o que absorve um desvio pequeno de relógio) **além** de `x-revalidate-secret`.

Não ponhas o segredo na query string — pode vazar em logs e referrers.

A rota aplica um limite suave por IP (30 pedidos / minuto, em memória). Acima disso responde **429**. Combina com regras de rate limit na Firewall da Vercel para um tecto na edge (pedidos bloqueados na edge não são facturados como invocações).

### Firewall da Vercel (limites na edge)

Regras WAF à medida exigem uma equipa **Pro** (ou superior). Começa em **log**, revê o tráfego e só depois muda a acção para `rate_limit` / `challenge`.

Regras sugeridas (Firewall → Custom Rules, ou `vercel firewall rules add`):

1. **RL revalidate POST** — `path = /api/revalidate` E `method = POST` → limite **60 / 60s / IP**, acção inicial **log**.
2. **RL páginas HTML** — `method = GET` E caminho diferente de `/_next*`, `/api*`, `/favicon*` → limite **300 / 60s / IP**, acção **log**.
3. **RL next/image** — caminho começa por `/_next/image` → limite **120 / 60s / IP**, acção **log**.
4. **Bloquear caminhos de sonda** — o caminho contém `/wp-admin`, `/.env`, `/.git`, `/phpmyadmin`, `/xmlrpc.php` → **deny**.

Painel: [Firewall](https://vercel.com/carlos-novais-projects/liberdadeavanca/firewall). Depois de ensaiar, publica na interface (ou `vercel firewall publish --yes`).

### Observabilidade (custo e erros a montante)

Os logs do servidor são JSON com um campo `event` estável (ver `src/shared/lib/log.ts`), pesquisável nos [Runtime Logs](https://vercel.com/carlos-novais-projects/liberdadeavanca/logs):

| Evento | Significado |
| --- | --- |
| `contentful.fetch_failed` | O pedido de entradas à CDA falhou (estado / tipo de conteúdo) |
| `contentful.response_invalid` | O JSON das entradas não tem a forma esperada; a página degrada |
| `contentful.tags_failed` | O pedido do catálogo de etiquetas falhou |
| `contentful.tags_invalid` | O catálogo veio com uma forma inesperada |
| `contentful.sitemap_failed` | O sitemap ficou só com as rotas estáticas |
| `socialdata.fetch_failed` | Erro HTTP da SocialData |
| `socialdata.user_missing` | Pesquisa vazia e id de perfil em falta |
| `socialdata.postprocess_failed` | Erro inesperado no feed do X |
| `revalidate.misconfigured` | Falta `REVALIDATE_SECRET` ou o segredo HMAC num ambiente publicado |
| `revalidate.unauthorized` | Segredo partilhado errado, ou assinatura HMAC rejeitada (`reason`) |
| `revalidate.rate_limited` | Limite suave da aplicação atingido |
| `revalidate.body_too_large` | Corpo acima de 64 KB |
| `revalidate.body_invalid` | JSON do webhook ilegível ou com forma inesperada |
| `revalidate.skipped_unknown_type` | Webhook aceite sem invalidar cache (tipo de conteúdo desconhecido) |
| `revalidate.ok` | Revalidação concluída |

Alertas sugeridos (Vercel Observability / log drain):

1. Pico de `contentful.fetch_failed` ou `socialdata.fetch_failed` (falha a montante ou credencial).
2. `revalidate.unauthorized` ou `revalidate.rate_limited` de forma continuada (abuso ou sonda a um segredo).
3. Volume de invocações em Production (painel → Observability) — acompanha o custo do HTML enquanto o site é dinâmico por causa dos nonces da CSP.

## Etiquetas públicas do Contentful

Os artigos mostram as etiquetas públicas de cada entrada (`metadata.tags`). O nome visível vem do catálogo `/tags` da Delivery API, por isso o id e o rótulo podem diferir (`imigrao` aparece como imigração). Etiquetas privadas não são devolvidas e não aparecem. Clicar numa etiqueta abre `/blog/tag/<id>`.

### Criar etiquetas públicas

1. No Contentful: **Settings → Tags** (ou a secção Tags na barra lateral).
2. Cria uma etiqueta com **visibility = public**.
3. O id entra no URL do filtro (`/blog/tag/economia`). O nome é o que os visitantes vêem.
4. A visibilidade não muda depois de criar — se criares uma etiqueta privada por engano, cria outra pública.

### Atribuir etiquetas aos artigos

1. Abre uma entrada `blogPost`.
2. Na barra lateral, abre **Tags** e acrescenta uma ou mais etiquetas públicas.
3. **Publica** a entrada (com o webhook de revalidação configurado) para o site actualizar.

Enquanto não houver etiquetas atribuídas e publicadas, a interface do blog esconde a linha de etiquetas.

## Robots e sitemap

`src/app/robots.ts` e `src/app/sitemap.ts` usam `SITE_URL` (ou `https://liberdadeavanca.vercel.app`). O sitemap inclui `/`, `/manifesto`, `/blog` e os artigos do Contentful. Se o Contentful falhar, o sitemap fica só com as três rotas estáticas.

## Política de segurança de conteúdo

A CSP é aplicada em cada pedido em `src/proxy.ts` (não em `next.config.ts`):

- **Scripts:** `'nonce-…'` + `'strict-dynamic'` — sem `'unsafe-inline'`. `'unsafe-eval'` só em desenvolvimento.
- **Estilos:** `'unsafe-inline'` mantém-se por causa do Motion e de atributos de estilo (a superfície principal de XSS são os scripts).

O layout raiz lê `headers()` para as páginas serem geradas no pedido e o Next.js poder pôr o nonce nos scripts do framework.

## Deploy

O projecto está na Vercel. Variáveis, firewall e logs ficam no projecto `liberdadeavanca`.
