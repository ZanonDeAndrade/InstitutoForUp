const { PrismaClient } = require("@prisma/client");
require("dotenv").config();
const { createMaintenanceContext } = require("./lib/safeMaintenance");

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
const context = createMaintenanceContext({ scriptName: "fix-course-pillars", destructive: false });

const normalizePillar = (value) => {
  if (!value) return null;
  const cleaned = String(value).toLowerCase().trim().replace(/[_\s]+/g, "-");
  return PILLAR_IDS.has(cleaned) ? cleaned : null;
};

async function main() {
  context.printBanner();
  context.assertValidDatabase();

  const courses = await prisma.course.findMany({ select: { id: true, pillar: true } });
  console.log(`[fix] found ${courses.length} courses`);

  const plannedUpdates = [];
  for (const course of courses) {
    const mapped = PILLAR_BY_COURSE[course.id];
    const normalized = normalizePillar(course.pillar);
    const pillar = normalized || mapped;
    if (!pillar) {
      console.log(`[fix] skipping ${course.id}: no pillar mapping`);
      continue;
    }
    if (pillar !== course.pillar) {
      plannedUpdates.push({ id: course.id, from: course.pillar, to: pillar });
    }
  }

  console.log("[fix] plano", JSON.stringify({ updates: plannedUpdates.length, courses: plannedUpdates }));
  if (context.dryRun) {
    context.printExecutionHint();
    context.logResult({ updated: 0, dryRun: true, planned: plannedUpdates.length });
    return;
  }

  context.assertCanExecute();
  const result = await prisma.$transaction(async (tx) => {
    let updated = 0;
    for (const item of plannedUpdates) {
      await tx.course.update({ where: { id: item.id }, data: { pillar: item.to } });
      updated += 1;
    }
    return { updated };
  });

  context.logResult({ ...result, planned: plannedUpdates.length });
}

main()
  .catch((err) => {
    console.error("[fix] error", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
