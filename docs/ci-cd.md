# CI/CD

## CI obrigatorio

O workflow `.github/workflows/ci.yml` roda em pull requests e pushes para `main`, `master` e `develop`.

Checks executados:

- instalacao reprodutivel com `npm ci` no frontend e no backend;
- typecheck frontend com `npm run typecheck`;
- typecheck backend com `npm run typecheck`;
- lint com `npm run lint`;
- testes frontend com `npm test`;
- testes backend com `npm test`;
- build frontend publico com `npm run build`;
- build admin com `npm run build:admin`;
- build backend com `npm run build`;
- `npm audit` com politica de falha para vulnerabilidades `high` ou `critical`;
- validacao Prisma com `npm run prisma:validate`;
- geracao do Prisma Client com `npx prisma generate --schema prisma/schema.prisma`.

Os jobs usam `actions/setup-node` com cache de npm baseado exclusivamente nos lockfiles:

- `package-lock.json`;
- `server/package-lock.json`.

O CI nao usa secrets reais. As variaveis obrigatorias do backend recebem valores de teste somente para validar inicializacao, Prisma e build.

## Politica de merge

Configure branch protection ou repository ruleset no provedor Git para impedir merge quando checks falharem.

Checks obrigatorios recomendados:

- `frontend`;
- `backend`;
- `npm audit`.

Regras recomendadas:

- exigir pull request antes de merge para `main`;
- exigir que todos os checks obrigatorios estejam verdes;
- exigir branch atualizada antes do merge;
- bloquear bypass de administradores, salvo processo formal de incidente;
- exigir pelo menos uma revisao de codigo;
- impedir force push e delecao de branch protegida.

Essa protecao nao e definida por YAML do workflow. Ela deve ser aplicada nas configuracoes do repositorio para que o GitHub bloqueie o botao de merge.

## Ambientes

Use GitHub Environments separados:

- `staging`;
- `production`.

Configure aprovadores obrigatorios para `production`. O ambiente `staging` pode ter aprovacao mais simples, mas deve usar secrets proprios e banco separado.

Variaveis por ambiente (`vars`):

- `PUBLIC_BASE_URL`;
- `CORS_ALLOWED_ORIGINS`;
- `STORAGE_DRIVER`;
- `SUPABASE_BUCKET`, se usar Supabase;
- `CAPTCHA_PROVIDER`.

Secrets por ambiente:

- `DATABASE_URL`;
- `DIRECT_URL`;
- `SUPABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `GOOGLE_SHEETS_CLIENT_EMAIL`;
- `GOOGLE_SHEETS_PRIVATE_KEY`;
- `GOOGLE_SHEETS_SPREADSHEET_ID`;
- `ADMIN_TOKEN_SECRET`;
- `RATE_LIMIT_REDIS_URL`;
- `CAPTCHA_SECRET_KEY`;
- token do provedor de deploy, por exemplo `DEPLOY_PROVIDER_TOKEN`.

Nunca coloque valores reais em workflows, scripts, README ou arquivos versionados.

## Deploy

O workflow `.github/workflows/deploy.yml` e manual (`workflow_dispatch`) e separado do CI. Ele nao roda em pull requests.

O workflow atual faz somente preflight:

- checkout do ref/SHA escolhido;
- instalacao reprodutivel;
- typecheck, lint, testes e builds;
- validacao Prisma;
- `prisma migrate status`;
- pacote de artefatos por 14 dias.

Ele para antes de qualquer publicacao real. Para habilitar deploy futuramente, adicione um passo especifico do provedor depois do preflight e mantenha:

- environment protection;
- secrets do provedor via GitHub Secrets;
- backup antes de migracao em producao;
- plano de rollback aprovado;
- deploy desabilitado para pull requests.

## Estrategia de migracao

Fluxo recomendado:

1. Rodar CI verde no pull request.
2. Fazer merge em branch principal protegida.
3. Executar deploy preflight para `staging`.
4. Aplicar migracoes em staging com `npx prisma migrate deploy --schema server/prisma/schema.prisma`.
5. Validar smoke tests em staging.
6. Antes de producao, gerar backup do banco e registrar o identificador do backup.
7. Executar preflight para `production`.
8. Aplicar migracoes em producao somente apos aprovacao do GitHub Environment.
9. Publicar backend e frontends usando artefatos do mesmo SHA validado.

Prefira migracoes expand/contract:

- primeiro adicionar campos/tabelas compativeis;
- fazer deploy da aplicacao que passa a escrever nos novos campos;
- migrar dados em job idempotente;
- remover campos antigos em deploy posterior.

Evite migracoes destrutivas no mesmo deploy que altera a aplicacao.

## Rollback

Rollback de aplicacao:

- redeploy do ultimo artefato aprovado;
- reinicio do backend;
- validacao de healthcheck, login admin, cursos, noticias, leads, imagens e uploads.

Rollback de banco:

- nao use `prisma migrate reset` em staging compartilhado ou producao;
- prefira migracao corretiva roll-forward quando possivel;
- se houver perda funcional ou corrupcao, restaurar backup gerado antes da janela de deploy;
- registrar impacto, horario, SHA implantado e backup restaurado.

Quando uma migracao nao for reversivel automaticamente, o PR deve incluir plano manual de retorno e criterio claro de abortar deploy.
