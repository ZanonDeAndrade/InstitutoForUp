/* Seed script to upsert courses with the exact requested descriptions */
const path = require("node:path");
const { PrismaClient } = require("../node_modules/@prisma/client");
const dotenvPath = path.join(__dirname, "..", ".env");
require("dotenv").config({ path: dotenvPath });

const prisma = new PrismaClient();

const valoresHumanos = {
  id: "valores-humanos",
  name: "Valores Humanos: Base para a Autorrealização (VH)",
  quote: "“O resultado tangível, depende dos valores intangíveis.” (U.M.)",
  descriptionLines: [
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
    "● Aulas Online ao Vivo: Sessões conduzidas para estudo, reflexão e aprofundamento das temáticas centrais do ciclo.",
    "● Jornadas de Imersão Presencial: Experiências práticas e vivenciais que promovem a mudança interior e a consolidação dos novos padrões de valor.",
    "- Duração: Cada ciclo de desenvolvimento terá a duração de três a seis meses, estruturado com temáticas específicas que atuam como fio condutor da transformação.",
    "",
    "A Quem se Destina",
    "- Este programa é desenhado para:",
    "● Todas as pessoas que buscam elevar sua performance profissional e pessoal a um novo patamar.",
    "● Indivíduos de qualquer idade e campo de atuação que anseiam por mais clareza, propósito e realização em suas vidas.",
  ],
};

const jovemLider = {
  id: "desenvolvimento-jovem-lider",
  name: "Desenvolvimento do Jovem Líder (DJL)",
  quote:
    "“No drama da vida, há uma enorme diferença entre os que escreveram para si mesmos um papel de destaque, e os que perdem tempo na vida por falta de objetivo” (Inamori).",
  descriptionLines: [
    "- O futuro da sua carreira e da sua vida é decidido no presente: \"o seu futuro depende das suas escolhas no aqui e agora.\"",
    "- A juventude é o momento ideal para construir a base do sucesso que transcende o tempo. Ser um verdadeiro líder exige mais do que talento: exige coerência e uma fundação inabalável. Liderança não é uma teoria passageira; é uma práxis cotidiana, um estilo de vida que se manifesta em todos os seus atos.",
    "",
    "Os Alicerces da Liderança de Destaque",
    "O Programa DJL visa equipá-lo com os pilares necessários para exercer uma liderança impactante e duradoura:",
    "1. Sólida Base de Valores Humanos: Princípios universais e atemporais que garantem a integridade e a autoridade moral em suas decisões.",
    "2. Estilo de Vida Distinto: O cultivo da disciplina, da visão e dos hábitos que diferenciam os profissionais de referência.",
    "3. Forma Mentis Próprio: A mentalidade estratégica essencial para o universo das grandes lideranças.",
    "Nosso convite é para você descobrir e performar a sua existência em direção a um papel de destaque, definindo um propósito que dê sentido e sabor à sua vida.",
    "",
    "Estrutura para o Sucesso Consistente",
    "Este programa foi desenhado para proporcionar um crescimento sólido e consistente, garantindo que o conhecimento se transforme em caráter e prática:",
    "● Composição: O Programa é estruturado em ciclos contínuos de formação.",
    "○Aulas Online ao Vivo: Sessões estratégicas para estudos de reflexão e aprofundamento dos conceitos de liderança.",
    "○ Jornadas de Imersão Presencial: Experiências vivenciais e práticas fundamentais para a internalização dos valores e a mudança efetiva na mentalidade de liderança.",
    "● Duração: Cada ciclo possui uma duração de seis meses, oferecendo o tempo necessário para o desenvolvimento consistente e a aplicação prática do aprendizado.",
    "Metodologia de Inspiração e Prática: O desenvolvimento é conduzido por professores e lideranças de alta performance com trajetórias comprovadamente exitosas. Eles atuarão como fontes de inspiração e guias práticos em sua jornada.",
    "",
    "A Quem se Destina",
    "Este programa é dedicado a:",
    "● Jovens que buscam uma realização superior e estão determinados a construir um destino profissional e pessoal diferenciado.",
    "● Futuros protagonistas, seja almejando cargos executivos ou a posição de profissionais de referência e alto impacto em suas áreas de atuação.",
  ],
};

const plr = {
  id: "performando-lideranca-resultado",
  name: "Performando Liderança e Resultado (PLR)",
  quote: "“Alcançar uma posição de destaque, de liderança não é difícil. O desafio é realizar a evolução contínua e in progress.”",
  descriptionLines: [
    "- O universo da liderança é um caleidoscópio de competências, exigindo perfeição contínua em múltiplas dimensões. Não basta ser bom em uma área; a liderança de excelência exige maestria em:",
    "● Forma Mentis e Estilo de Vida: A atitude e a coerência do líder.",
    "● Capacidade Técnica e Gestão: A sagacidade na gestão do resultado ao escopo.",
    "● Intuição e Antecipação: A habilidade de ler cenários e antecipar eventos.",
    "● Gestão de Pessoas e Relações: A arte de formar equipes e das relações diplomáticas.",
    "",
    "Objetivo: Potencialização e Maestria",
    "- O Programa Performando Liderança e Resultado (PLR) visa performar e exponenciar a sua capacidade de liderança. Começamos com um mapeamento inicial preciso de sua situação atual, condição e os resultados almejados.",
    "- Nosso foco é ampliar o uso do seu quântico de inteligência na realização dos seus propósitos de vida.",
    "",
    "O Resgate do Mestre Interior",
    "- A verdadeira chave para a liderança reside em um olhar para dentro de si, resgatando o verdadeiro mestre de vida que habita em cada um. A dificuldade em reconhecer esse potencial é causada pela \"enxurrada\" de informações externas que nos confunde e nos afasta do nosso íntimo.",
    "- O olhar neutro e preciso de um técnico é de grande contribuição para a clareza e transparência das informações, especialmente em momentos de tomada de decisão importante em sua vida. Nossos profissionais atuam como meros mediadores para ler e traduzir a \"informação-vida\" que você já carrega.",
    "",
    "Estrutura e Dinâmica de Alto Nível",
    "- O PLR é um programa de imersão e consultoria, moldado para atender às suas exigências de crescimento:",
    "● Formato: O Programa é composto por aulas online ao vivo e residence full immersion presencial.",
    "● Desenvolvimento Contínuo: A cada encontro, serão desenvolvidos os múltiplos aspectos do universo da liderança, sempre de acordo com a dinâmica e as exigências do grupo formado.",
    "● Consultoria Estratégica: Serão realizadas análises profundas de problemas e desafios, mediante consultoria individual ou dinâmicas de grupo.",
    "● Duração: Cada ciclo tem duração de três a seis meses, focado em uma temática principal que servirá de fio condutor para o seu desenvolvimento.",
    "- Metodologia de Referência: O desenvolvimento é realizado mediante aulas práticas, vivenciais e estudos de reflexão, conduzidos por lideranças de alta performance que possam servir de referência em sua caminhada.",
    "Pronto para realizar a evolução contínua e performar seus resultados como líder de excelência?",
  ],
};

const cafeCultural = {
  id: "cafe-cultural",
  name: "Café Cultural",
  quote: undefined,
  descriptionLines: [
    "Um programa aberto e gratuito desenhado para elevar o humanismo, a autoestima e a dignidade humana, reacendendo o prazer de viver em direção à autorrealização e ao sucesso na própria vida.",
    "",
    "O Poder da Reflexão e do Legado",
    "O Café Cultural é um espaço de inspiração e crescimento, baseado na sabedoria que moldou a humanidade.",
    "● Valores em Foco: Encontros mensais dedicados à leitura e à reflexão profunda sobre os Valores Humanos universais.",
    "● Fontes de Inspiração: Inspirados nos grandes pensadores e lideranças mundiais – tanto contemporâneos quanto perenes, cujos legados (obras e realizações) nos beneficiam até hoje.",
    "Elevando o Nível Cultural e Pessoal",
    "O Café Cultural vai além da simples leitura:",
    "● Ele instiga a mente, abrindo a curiosidade para novos horizontes.",
    "● Proporciona um debate leve e prazeroso sobre temas profundos.",
    "● Eleva o seu nível cultural, reforçando a ideia de que ser culto é um sinal de nobreza interior.",
    "No final de cada encontro, os participantes saem inspirados, com ímpeto renovado e a \"vontade de fazer mais\" em suas vidas.",
    "Informações Práticas",
    "● Frequência: Encontros mensais.",
    "● Dia: Última quarta-feira de cada mês.",
    "● Próximo Ciclo: Inicia em Fevereiro de 2026.",
  ],
};

const jornadaLideristica = {
  id: "jornada-lideristica",
  name: "Jornada Liderística: Critério Organísmico, Intuição e Racionalidade",
  quote:
    "“Cada um é resultado das milhares de decisões e escolhas diárias. Seu futuro é resultado das suas escolhas no aqui e agora. Suas escolhas têm propósito de vida?”",
  descriptionLines: [
    "Por que a Jornada Liderística?",
    "Somos feitos de miríades de escolhas, desde as mais insignificantes até as mais impactantes, que determinam o rumo da vida.",
    "A grande questão é: qual critério utilizamos nas escolhas e tomadas de decisão?",
    "Somos protagonistas das nossas escolhas ou seguimos a corrente popular, redes sociais e opiniões alheias?",
    "Voamos o voo da águia ou fazemos parte de um cardume de opiniões?",
    "Nossos resultados são consequência das escolhas diárias, feitas com coerência. O critério organísmico e a racionalidade sobre a intuição são a melhor estrada para escolhas vencedoras, dia após dia.",
    "Vivendo o aqui e agora com propósito claro, baseado nos meios, idade e condições econômicas, construímos uma existência com evolução contínua. No final, o propósito é único: realizar a metafísica da alma.",
    "O convite é: vamos performar as suas escolhas versus a sua estrada do ser?",
    "",
    "Propósito e Temáticas",
    "A jornada visa a prática diária para decisões e escolhas otimais.",
    "Temáticas centrais:",
    "• Critério organísmico e percepção organísmica — compreensão com vivências práticas.",
    "• Miricismo cotidiano, estilo de vida e critério organísmico.",
    "• Intuição e racionalidade: performance para as escolhas otimais.",
    "",
    "Metodologia e Coordenação",
    "Metodologias de imersão:",
    "• Aulas dialogadas.",
    "• Atividades práticas.",
    "• Dinâmicas de grupo.",
    "• Instrumentos de intervenção.",
    "Coordenação:",
    "• Prof. Ms. Mami Ueno.",
    "• Mestre em Educação (Universidad SEK, Chile), especializações em Ontopsicologia (Universidade de São Petersburgo/Rússia) e Direito Internacional Público e Privado (UFRGS), MBAs em Business Intuition (Antonio Meneghetti Faculdade e FOIL, Itália).",
    "• Empresária, consultora em projetos nacionais e internacionais, CEO da Ueno Profit e professora da Antonio Meneghetti Faculdade.",
    "",
    "Datas e Locais",
    "• Data: 12 de dezembro (sexta) a 14 de dezembro (domingo).",
    "• Local: Hotel Capo Zorial e Projeto Terra - Recanto Maestro - RS.",
  ],
};

const coursesData = [valoresHumanos, jovemLider, plr, jornadaLideristica, cafeCultural];

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

  for (const course of coursesData) {
    const description = course.descriptionLines.join("\n");
    const fields = { name: true, email: true, phone: true, source: true, quote: course.quote };

    await prisma.course.upsert({
      where: { id: course.id },
      update: {
        name: course.name,
        description,
        fields: JSON.stringify(fields),
      },
      create: {
        id: course.id,
        name: course.name,
        description,
        fields: JSON.stringify(fields),
      },
    });
  }

  console.log("Cursos atualizados com os textos exatos (VH, DJL, PLR, Jornada Liderística).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
