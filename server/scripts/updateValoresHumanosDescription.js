const { PrismaClient } = require("@prisma/client");
require("dotenv").config();
const { createMaintenanceContext } = require("./lib/safeMaintenance");

const prisma = new PrismaClient();
const context = createMaintenanceContext({ scriptName: "update-valores-humanos-description", destructive: false });

const description = `VocÃª jÃ¡ se perguntou por que algumas pessoas atingem a plenitude de seu potencial enquanto outras, mesmo talentosas, vivem em constante insatisfaÃ§Ã£o? A resposta nÃ£o estÃ¡ em fatores externos, mas na qualidade da fundaÃ§Ã£o interior.
Todos nÃ³s nascemos com uma dÃ¡diva, um potencial inato. Contudo, a verdadeira realizaÃ§Ã£o plena exige o ato corajoso de olhar para dentro. Ã‰ necessÃ¡rio identificar limites, abandonar padrÃµes mentais antigos e iniciar uma profunda transformaÃ§Ã£o no seu modo de pensar, seu estilo de vida e, principalmente, seus Valores.
O caminho do sucesso sustentÃ¡vel Ã© pavimentado por Valores Universais e Atemporais. Seja Jorge Gerdau, Luiza Trajano em nosso contexto, ou SÃ³crates, Buda e Da Vinci na histÃ³ria da humanidade, todos os grandes lÃ­deres e gÃªnios cultivaram princÃ­pios perenes que transcenderam raÃ§as, religiÃµes e naÃ§Ãµes. Seus resultados notÃ³rios sÃ£o a prova irrefutÃ¡vel da eficÃ¡cia dessa base.

PropÃ³sito do Programa
O Programa de Desenvolvimento em Valores Humanos (VH) tem como objetivo central formar a base para indivÃ­duos que buscam ser vencedores, alcanÃ§ando o sucesso com um profundo PropÃ³sito de vida.
Este Ã© o convite para viver para SER â€“ realizar o projeto Ãºnico que a vida lhe confiou, conferindo o verdadeiro sentido Ã\u00a0 sua jornada, indo alÃ©m do mero viver por viver.

Metodologia de Desenvolvimento e Alta Performance
Nosso programa Ã© uma combinaÃ§Ã£o estratÃ©gica de aprendizado teÃ³rico e vivÃªncias prÃ¡ticas para garantir a absorÃ§Ã£o e aplicaÃ§Ã£o dos valores:
â— Aulas Online ao Vivo: SessÃµes conduzidas para estudo, reflexÃ£o e aprofundamento das temÃ¡ticas centrais do ciclo.
â— Jornadas de ImersÃ£o Presencial: ExperiÃªncias prÃ¡ticas e vivenciais que promovem a mudanÃ§a interior e a consolidaÃ§Ã£o dos novos padrÃµes de valor.
DuraÃ§Ã£o: Cada ciclo de desenvolvimento terÃ¡ a duraÃ§Ã£o de trÃªs a seis meses, estruturado com temÃ¡ticas especÃ­ficas que atuam como fio condutor da transformaÃ§Ã£o.

A Quem se Destina
Este programa Ã© desenhado para:
â— Todas as pessoas que buscam elevar sua performance profissional e pessoal a um novo patamar.
â— IndivÃ­duos de qualquer idade e campo de atuaÃ§Ã£o que anseiam por mais clareza, propÃ³sito e realizaÃ§Ã£o em suas vidas.
Se vocÃª estÃ¡ pronto para olhar para dentro, construir sua base de valores e iniciar a jornada para a AutorrealizaÃ§Ã£o e o sucesso com propÃ³sito.`;

async function main() {
  context.printBanner();
  context.assertValidDatabase();

  const id = "valores-humanos";
  const name = "Valores Humanos: Base para a AutorrealizaÃ§Ã£o (VH)";
  const pillar = "valores-humanos";

  const existing = await prisma.course.findUnique({
    where: { id },
    select: { id: true, name: true, description: true, pillar: true },
  });
  const willCreate = !existing;
  const willUpdate = Boolean(
    existing && (existing.name !== name || existing.description !== description || existing.pillar !== pillar),
  );

  console.log(
    "[update-valores-humanos] plano",
    JSON.stringify({
      create: willCreate ? 1 : 0,
      update: willUpdate ? 1 : 0,
      unchanged: existing && !willUpdate ? 1 : 0,
      courseId: id,
    }),
  );

  if (context.dryRun) {
    context.printExecutionHint();
    context.logResult({ created: 0, updated: 0, dryRun: true });
    return;
  }

  context.assertCanExecute();
  const result = await prisma.$transaction(async (tx) => {
    if (existing && !willUpdate) return { created: 0, updated: 0, unchanged: 1 };

    const upserted = await tx.course.upsert({
      where: { id },
      update: { name, description, pillar },
      create: { id, name, description, pillar },
    });

    return {
      created: willCreate ? 1 : 0,
      updated: willUpdate ? 1 : 0,
      unchanged: 0,
      courseId: upserted.id,
      descriptionLength: description.length,
    };
  });
  context.logResult(result);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
