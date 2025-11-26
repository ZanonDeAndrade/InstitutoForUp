# FORUP Lead Forge API

API em Express + Prisma para guardar cursos e imagens.

## Rodar local (SQLite pronto para uso)

```bash
cd server
cp .env.example .env
# (SQLite) DATABASE_URL já aponta para file:./dev.db
npm install
npx prisma migrate dev
npm run dev
```

## Rotas principais
- `POST /api/courses` cria/atualiza curso (`{ id, name, description?, fields? }`)
- `PUT /api/courses/:courseId` idem update
- `GET /api/courses` lista cursos com imagens
- `GET /api/courses/:courseId` busca curso
- `POST /api/courses/:courseId/images` upload múltiplo (`images[]`), valida PNG/JPG/WebP 2MB
- `DELETE /api/courses/:courseId/images/:imageId` remove imagem (e arquivo local/S3)

Uploads locais ficam em `/uploads` (ou S3 se `STORAGE_DRIVER=s3`).

## Usar Postgres (opcional)
1. Ajuste `provider = "postgresql"` no `prisma/schema.prisma`.
2. Altere `DATABASE_URL` no `.env` para a conexão Postgres.
3. Rode `npx prisma migrate dev` novamente.

## Supabase Storage (sem cartão, free tier)
1. No painel Supabase: crie um bucket (ex.: `course-images`) em Storage.
2. Em Settings > API, copie o `service_role` key (use somente no backend).
3. No `.env` do backend, use:
   ```
   STORAGE_DRIVER=supabase
   SUPABASE_URL=https://<seu-projeto>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   SUPABASE_BUCKET=courses
   PUBLIC_BASE_URL=http://localhost:4000
   ```
4. Reinicie o backend (`npm run dev`). Uploads passarão a subir direto para o bucket e gerar URL pública.
