# FORUP Lead Forge API

API em Express + Prisma para guardar cursos, notícias, leads e imagens.

## Rodar local

```bash
cd server
cp .env.example .env
# Preencha DATABASE_URL, DIRECT_URL e demais variáveis obrigatórias com valores reais fora do Git.
npm install
npx prisma migrate dev
npm run create-admin -- --email admin@example.com --username admin --role super_admin
npm run dev
```

## Rotas principais

- `POST /api/courses` cria/atualiza curso (`{ id, name, description?, fields? }`)
- `PUT /api/courses/:courseId` atualiza curso
- `GET /api/courses` lista cursos com imagens
- `GET /api/courses/:courseId` busca curso
- `POST /api/courses/:courseId/images` faz upload múltiplo (`images[]`), validando PNG/JPG/WebP até 2MB
- `DELETE /api/courses/:courseId/images/:imageId` remove imagem e o arquivo armazenado

Uploads locais ficam em `/uploads`. Para storage externo, configure `STORAGE_DRIVER=supabase` ou `STORAGE_DRIVER=s3`.

## Banco de dados

O Prisma está configurado para PostgreSQL. Defina `DATABASE_URL` e `DIRECT_URL` no `.env` local ou no gerenciador de segredos do ambiente.

## Administradores

O acesso administrativo usa usuarios no banco, com senha armazenada somente como hash bcrypt. Nao existe senha administrativa global em `.env`.

Para simular a criacao do primeiro administrador:

```bash
npm run create-admin -- --email admin@example.com --username admin --role super_admin
```

Para gravar de fato, use `--execute` apos revisar o plano:

```bash
npm run create-admin -- --email admin@example.com --username admin --role super_admin --execute
```

Roles disponiveis:

- `super_admin`
- `editor`
- `viewer`

Se o banco nao for local, o script exige confirmacao forte:

```bash
npm run create-admin -- --email admin@example.com --username admin --role super_admin --execute --confirm create-admin:<host-do-banco>:<nome-do-banco>
```

Nunca passe a senha por argumento de linha de comando. O script solicita a senha interativamente e grava apenas o hash.

## Scripts de seed e manutencao

Todos os scripts em `server/scripts` executam em modo dry-run por padrao. Eles detectam `NODE_ENV`, `DATABASE_URL`, host e nome do banco, redigem usuario/senha da URL no console e mostram o plano antes de qualquer mutacao.

Comandos disponiveis:

```bash
npm run fix:pillars
npm run update:valores-humanos
npm run seed:valores-humanos
```

Para gravar em banco local, use `--execute`:

```bash
npm run fix:pillars -- --execute
npm run update:valores-humanos -- --execute
```

Operacoes destrutivas exigem confirmacao explicita adicional. O seed `seed:valores-humanos` pode remover cursos obsoletos previamente listados no plano; ele nao usa `deleteMany` indiscriminado e exclui somente IDs retornados pela pre-visualizacao:

```bash
npm run seed:valores-humanos -- --execute --allow-destructive
```

Para banco remoto ou staging, adicione a frase exibida pelo dry-run:

```bash
npm run seed:valores-humanos -- --execute --allow-destructive --confirm seed-valores-humanos:<host-do-banco>:<nome-do-banco>
```

Em producao, alem de `--confirm`, e obrigatorio informar a confirmacao adicional:

```bash
npm run seed:valores-humanos -- --execute --allow-destructive --confirm seed-valores-humanos:<host-do-banco>:<nome-do-banco> --confirm-production production:seed-valores-humanos:<nome-do-banco>
```

Execute sempre primeiro contra um banco temporario ou restaurado de backup, por exemplo `DATABASE_URL=postgresql://user:password@localhost:5432/forup_h14_temp npm run seed:valores-humanos`, revise o plano e so depois rode com `--execute`. Scripts idempotentes registram quantidades criadas, atualizadas, removidas, inalteradas e planejadas.

## Tokens administrativos

Os tokens administrativos sao JWTs assinados no backend com `ADMIN_TOKEN_SECRET`, algoritmo `HS256`, issuer `forup-admin-api` e audience `forup-admin-panel`. O backend valida assinatura, expiracao, issuer, audience, subject, tipo do token e role antes de liberar rotas administrativas.

O JWT administrativo e enviado apenas em cookie HttpOnly `forup_admin_session`, com `Secure` em producao, `SameSite=Lax`, `Path=/api` e expiracao controlada pelo backend. O frontend nao deve ler, armazenar ou decodificar esse token. Requisicoes administrativas usam `credentials: include` e protecao CSRF por cookie/header `forup_admin_csrf`.

Configure `CORS_ALLOWED_ORIGINS` com as origens reais do painel administrativo. Requisicoes com credenciais vindas de origens fora dessa lista sao rejeitadas.

Este fluxo nao usa refresh token nem sessao persistida no banco. O logout revoga o `jti` atual em memoria ate a expiracao do token. Para revogar todos os tokens stateless ja emitidos, rotacione manualmente `ADMIN_TOKEN_SECRET` no gerenciador de segredos e reinicie o backend. Isso força novo login dos administradores.

## Headers de seguranca e CORS

O backend usa Helmet com CSP explicita, sem `unsafe-inline` e sem `unsafe-eval`. A politica define `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff` e `Permissions-Policy` restritiva. HSTS e habilitado somente em producao.

Configure CORS de forma explicita:

- `CORS_ALLOWED_ORIGINS`: origens reais do frontend publico e do painel admin, separadas por virgula.
- `CORS_ALLOWED_METHODS`: metodos aceitos no preflight.
- `CORS_ALLOWED_HEADERS`: headers aceitos no preflight, incluindo `X-CSRF-Token`.
- `CORS_PREFLIGHT_MAX_AGE_SECONDS`: cache do preflight.
- `CORS_ALLOW_NON_BROWSER_REQUESTS`: deixe `false` por padrao. Use `true` somente quando houver cliente server-to-server confiavel sem header `Origin`; browsers sem `Origin` e com fetch metadata continuam rejeitados.

O middleware CORS e aplicado apenas sob `/api`. Assets publicos em `/uploads` e o proxy publico `/api/images/*` nao dependem de CORS com credenciais.

## Uploads de imagem

Uploads administrativos sao restritos a usuarios autenticados com role autorizada e tambem passam por rate limit. O backend nao confia no `Content-Type` enviado pelo cliente: cada arquivo e mantido em memoria ate a validacao, tem assinatura real verificada, e decodificado com `sharp`.

Politica atual:

- entrada aceita: PNG, JPEG e WebP reais;
- SVG, HTML, scripts, executaveis, arquivos corrompidos e poliglotas sao rejeitados;
- tamanho maximo: 2 MB por arquivo;
- dimensoes maximas: 4096 x 4096 e limite de 12 megapixels;
- saida armazenada: WebP reprocessado, sem metadados EXIF;
- nome final: UUID aleatorio, sem usar o nome enviado pelo cliente;
- drivers local, S3 e Supabase recebem somente o buffer ja reprocessado.

## Rate limiting

O backend aplica limites separados por rota:

- login: `RATE_LIMIT_LOGIN_WINDOW_MS` / `RATE_LIMIT_LOGIN_MAX`
- criacao publica de leads: `RATE_LIMIT_LEADS_WINDOW_MS` / `RATE_LIMIT_LEADS_MAX`
- uploads administrativos: `RATE_LIMIT_UPLOAD_WINDOW_MS` / `RATE_LIMIT_UPLOAD_MAX`
- proxy de imagens: `RATE_LIMIT_IMAGE_PROXY_WINDOW_MS` / `RATE_LIMIT_IMAGE_PROXY_MAX`
- endpoints administrativos sensiveis: `RATE_LIMIT_ADMIN_WINDOW_MS` / `RATE_LIMIT_ADMIN_MAX`

Respostas limitadas retornam HTTP 429 com `Retry-After` e corpo padronizado `{ requestId, code: "RATE_LIMITED", policy, retryAfter }`.

Configure `TRUST_PROXY_HOPS` com o numero exato de proxies confiaveis antes do Express. Nao use `trust proxy=true` de forma ampla. Em producao, `RATE_LIMIT_REDIS_URL` e obrigatorio para usar store compartilhado e evitar limites isolados por instancia.

## Protecao do formulario publico de leads

`POST /api/leads` aplica rate limit proprio, honeypot, CAPTCHA validado no backend, idempotencia e deduplicacao por e-mail, telefone, curso e janela de tempo.

As regras de campos obrigatorios do formulario publico sao validadas no backend a partir de `Course.fields` salvo no banco. O cliente informa apenas `courseId`; o backend busca o curso, aplica a configuracao confiavel de `name`, `email`, `phone` e `source`, usa o nome canonico do curso do banco e rejeita campos desconhecidos no payload de lead. Quando `fields` esta ausente ou invalido, o padrao seguro exige os quatro campos.

Em producao, configure:

- `CAPTCHA_PROVIDER=turnstile` ou `CAPTCHA_PROVIDER=hcaptcha`
- `CAPTCHA_SECRET_KEY` somente no backend
- `LEAD_DEDUP_WINDOW_MS` para a janela de deduplicacao
- `VITE_TURNSTILE_SITE_KEY` no frontend quando usar Turnstile

O backend nao confia no token enviado pelo frontend sem validar no provedor. Submissoes rejeitadas por honeypot, CAPTCHA invalido, tempo suspeito ou conteudo automatizado geram logs com `requestId` e hashes, sem armazenar dados pessoais do formulario.

## Banco local limpo e provider Prisma

O banco oficial do projeto e PostgreSQL em desenvolvimento, homologacao e producao. `DATABASE_URL` e `DIRECT_URL` devem usar `postgresql://` ou `postgres://`; URLs SQLite como `file:./dev.db` sao rejeitadas na inicializacao do backend.

O arquivo `server/prisma/dev.db` era um banco SQLite local e nao faz parte do banco oficial do projeto. Ele deve permanecer fora do Git; `.gitignore` ignora `*.db`, `*.sqlite`, `*.sqlite3` e `server/prisma/dev.db`. Remover o arquivo do indice Git nao apaga a copia local do desenvolvedor.

Para criar um banco local limpo, use PostgreSQL:

```bash
createdb forup_dev
cp .env.example .env
# ajuste DATABASE_URL e DIRECT_URL para postgresql://<user>:<password>@localhost:5432/forup_dev
npx prisma migrate dev
npx prisma generate
```

Se `createdb` nao estiver disponivel, crie o banco no Docker, Supabase local ou na ferramenta PostgreSQL da equipe, mantendo o provider `postgresql` em `prisma/schema.prisma`. Nao altere o provider para SQLite para desenvolvimento local.

## Retencao e exclusao de leads

Leads nao devem ser removidos por rotas genericas ou operacoes fisicas acidentais. A listagem administrativa de leads retorna somente registros ativos por padrao e aceita paginacao e filtro de visibilidade.

Operacoes disponiveis:

- `POST /api/leads/bulk-delete`: soft delete de leads selecionados, por curso ou todos os ativos. Exige usuario administrativo autorizado, motivo e frase de confirmacao server-side.
- `POST /api/leads/restore`: restaura leads arquivados. Exige motivo, confirmacao e auditoria.
- `DELETE /api/leads/permanent`: exclusao fisica somente para `super_admin`, apenas de leads ja arquivados, com motivo, confirmacao e auditoria.

Campos de retencao em `Lead`: `deletedAt`, `deletedBy` e `deletionReason`. Toda operacao de arquivamento, restauracao ou exclusao fisica grava `LeadDeletionAudit` com ator, role, escopo, IDs afetados, motivo, confirmacao e contagem afetada.

## Erros e logs

Todas as respostas de erro da API devem passar pelo `errorHandler` central e incluir `requestId` para correlacao. O backend diferencia erros de validacao, autenticacao, autorizacao, nao encontrado, conflito e erro interno. Respostas publicas nao devem expor stack trace, SQL, caminhos internos, chaves de storage, URLs assinadas, tokens, cookies, credenciais ou payloads pessoais.

Logs sao estruturados em JSON e passam por redacao automatica de campos sensiveis. Detalhes tecnicos devem ficar somente no servidor, associados ao `requestId`. Nao registre headers completos, bodies de formularios, tokens, cookies, service role, credenciais Google, URLs assinadas ou dados pessoais de leads.

## Supabase Storage

1. No painel Supabase, crie um bucket em Storage.
2. Em Settings > API, copie a chave `service_role`. Use essa chave somente no backend.
3. No `.env` do backend, use placeholders como referência e preencha valores reais somente fora do Git:

```env
STORAGE_DRIVER=supabase
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SUPABASE_BUCKET=courses
PUBLIC_BASE_URL=http://localhost:4010
```

Nunca versionar `.env`, chaves privadas, dumps de banco ou credenciais de serviço.

## Rotacao de credenciais expostas

Se a `SUPABASE_SERVICE_ROLE_KEY` ja apareceu em arquivo versionado, remova-la do arquivo atual nao invalida a chave nem apaga o historico Git. Rode manualmente:

1. Gere uma nova service role key no painel Supabase.
2. Atualize somente o gerenciador de segredos do backend.
3. Reinicie o backend.
4. Revogue a service role key antiga.
5. Revise logs e bancos para remover URLs assinadas antigas, se existirem.

A service role deve existir apenas no backend. Nunca exponha essa chave em frontend, builds, logs, documentacao publica ou arquivos versionados.
