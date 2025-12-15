/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

// Slug -> pillar mapping
const PILLAR_BY_COURSE = {
  "valores-humanos": "valores-humanos",
  "cafe-cultural": "valores-humanos",
  "criterios-valores": "valores-humanos",
  "desenvolvimento-jovem-lider": "lideranca-resultado",
  "performando-lideranca-resultado": "lideranca-resultado",
  "performando-liderancas": "lideranca-resultado",
  "jovens-lideres": "lideranca-resultado",
  "jornada-lideristica": "lideranca-resultado",
  "criatividade-empresarial": "criatividade-empresarial",
};

const PILLAR_IDS = new Set(Object.values(PILLAR_BY_COURSE));

const prisma = new PrismaClient();

const normalizePillar = (value) => {
  if (!value) return null;
  const cleaned = String(value).toLowerCase().trim().replace(/[_\s]+/g, "-");
  return PILLAR_IDS.has(cleaned) ? cleaned : null;
};

async function main() {
  const courses = await prisma.course.findMany({ select: { id: true, pillar: true } });
  console.log(`[fix] found ${courses.length} courses`);

  let updates = 0;
  for (const course of courses) {
    const mapped = PILLAR_BY_COURSE[course.id];
    const normalized = normalizePillar(course.pillar);
    const pillar = normalized || mapped;
    if (!pillar) {
      console.log(`[fix] skipping ${course.id}: no pillar mapping`);
      continue;
    }
    if (pillar !== course.pillar) {
      await prisma.course.update({ where: { id: course.id }, data: { pillar } });
      updates += 1;
      console.log(`[fix] updated ${course.id} -> ${pillar}`);
    }
  }

  console.log(`[fix] done. Updated ${updates} courses.`);
}

main()
  .catch((err) => {
    console.error("[fix] error", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
