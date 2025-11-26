/* Seed script to upsert the Valores Humanos course with the exact requested description */
const path = require("node:path");
const { PrismaClient } = require("../node_modules/@prisma/client");
const dotenvPath = path.join(__dirname, "..", ".env");
require("dotenv").config({ path: dotenvPath });

const prisma = new PrismaClient();

const descriptionLines = [
  "- Você já se perguntou por que algumas pessoas atingem a plenitude de seu potencial enquanto outras, mesmo talentosas, vivem em constante insatisfação? A resposta não está em fatores externos, mas na qualidade da fundação interior.",
  "- Todos nós nascemos com uma dádiva, um potencial inato. Contudo, a verdadeira realização plena exige o ato corajoso de olhar para dentro. É necessário identificar limites, abandonar padrões mentais antigos e iniciar uma profunda transformação no seu modo de pensar, seu estilo de vida e, principalmente, seus Valores.",
  "- O caminho do sucesso sustentável é pavimentado por Valores Universais e Atemporais. Seja Jorge Gerdau, Luiza Trajano em nosso contexto, ou Sócrates, Buda e Da Vinci na história da humanidade, todos os grandes líderes e gênios cultivaram princípios perenes que transcenderam raças, religiões e nações. Seus resultados notórios são a prova irrefutável da eficácia dessa base.",
  "",
  "Propósito do Programa",
  "- O Programa de Desenvolvimento em Valores Humanos (VH) tem como objetivo central formar a base para indivíduos que buscam ser vencedores, alcançando o sucesso com um profundo Propósito de vida.",
  "- Este é o convite para viver para SER – realizar o projeto único que a vida lhe confiou, conferindo o verdadeiro sentido à sua jornada, indo além do mero viver por viver.",
  "",
  "Metodologia de Desenvolvimento e Alta Performance",
  "- Nosso programa é uma combinação estratégica de aprendizado teórico e vivências práticas para garantir a absorção e aplicação dos valores:",
  "●\tAulas Online ao Vivo: Sessões conduzidas para estudo, reflexão e aprofundamento das temáticas centrais do ciclo.",
  "●\tJornadas de Imersão Presencial: Experiências práticas e vivenciais que promovem a mudança interior e a consolidação dos novos padrões de valor.",
  "- Duração: Cada ciclo de desenvolvimento terá a duração de três a seis meses, estruturado com temáticas específicas que atuam como fio condutor da transformação.",
  "",
  "A Quem se Destina",
  "- Este programa é desenhado para:",
  "●\tTodas as pessoas que buscam elevar sua performance profissional e pessoal a um novo patamar.",
  "●\tIndivíduos de qualquer idade e campo de atuação que anseiam por mais clareza, propósito e realização em suas vidas.",
  "- Se você está pronto para olhar para dentro, construir sua base de valores e iniciar a jornada para a Autorrealização e o sucesso com propósito.",
];

const description = descriptionLines.join("\n");

async function main() {
  // Remove curso antigo se ainda existir
  await prisma.course.deleteMany({
    where: {
      OR: [
        { id: "criatividade-empresarial" },
        { name: "Criatividade Empresarial" },
      ],
    },
  });

  await prisma.course.upsert({
    where: { id: "valores-humanos" },
    update: {
      name: "Valores Humanos: Base para a Autorrealização (VH)",
      description,
    },
    create: {
      id: "valores-humanos",
      name: "Valores Humanos: Base para a Autorrealização (VH)",
      description,
      fields: JSON.stringify({ name: true, email: true, phone: true, source: true }),
    },
  });

  console.log("Curso 'Valores Humanos' atualizado com o texto exato.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
