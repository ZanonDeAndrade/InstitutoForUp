# Conteúdo estruturado de cursos

## Inventário removido de `DynamicCourse`

| Regra/conteúdo anterior | Destino atual |
| --- | --- |
| Citações específicas de Valores Humanos e PLR | `content.hero.quote` |
| Títulos reconhecidos em VH, DJL, PLR e Jornada Liderística | `content.sections[].heading` |
| Divisão de descrição em parágrafos e listas | `content.sections[]` com `paragraphs` e `bullets` |
| Texto curto/completo do Café Cultural | `content.cta.collapsedSections` e `content.sections` |
| Link, rótulo e aviso do WhatsApp | CTA externo tipado em `content.cta` |
| Campos do formulário e citação misturados em `fields` | `content.form.fields` e `content.hero.quote` |
| Imagens editoriais | `content.images`; imagens legadas continuam em `CourseImage` |
| Metadados da página | `content.seo` |
| Dados próprios de uma edição/curso | `content.specific` com valores escalares |

`DynamicCourse` não interpreta HTML. O DTO e o cliente rejeitam tags HTML, URLs externas fora de HTTP(S) e URLs de imagem que não sejam HTTP(S) ou caminhos locais.

## Compatibilidade

Enquanto `Course.content` estiver vazio ou inválido, `buildLegacyCourseContent` converte `description`, `fields`, imagens e as regras conhecidas para o mesmo modelo em memória. Isso permite publicar a aplicação antes ou depois da migração dos dados.

## Aplicação no banco

1. Aplicar as migrações com o fluxo normal do ambiente (`prisma migrate deploy`).
2. Revisar o plano sem escrita:

   `npm run seed:course-content -- --dry-run`

3. Executar conforme as confirmações impressas pelo próprio script. O seed compara JSON com chaves ordenadas e não atualiza registros que já estejam iguais.
