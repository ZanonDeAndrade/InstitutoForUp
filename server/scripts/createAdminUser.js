const readline = require("node:readline");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const { createMaintenanceContext } = require("./lib/safeMaintenance");

const prisma = new PrismaClient();
const ROLES = new Set(["super_admin", "editor", "viewer"]);
const BCRYPT_COST = 12;

const context = createMaintenanceContext({ scriptName: "create-admin", destructive: false });
const { args } = context;

const normalizeIdentifier = (value) => value.trim().toLowerCase();
const redactConsoleMessage = (value) =>
  String(value).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]");

const askHidden = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    rl._writeToOutput = function _writeToOutput(output) {
      if (rl.stdoutMuted && output !== "\n" && output !== "\r\n") {
        rl.output.write("*");
        return;
      }
      rl.output.write(output);
    };
    rl.stdoutMuted = true;
  });

const main = async () => {
  context.printBanner();
  const email = normalizeIdentifier(args.get("email") ?? "");
  const username = normalizeIdentifier(args.get("username") ?? "");
  const role = args.get("role") ?? "super_admin";

  if (!email || !username) {
    throw new Error(
      "Use: npm run create-admin -- --email admin@example.com --username admin --role super_admin [--execute]",
    );
  }
  if (!ROLES.has(role)) {
    throw new Error(`Role invalida. Use uma de: ${Array.from(ROLES).join(", ")}`);
  }

  context.assertValidDatabase();

  const existing = await prisma.adminUser.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true },
  });
  if (existing) {
    context.logResult({ created: 0, skipped: 1, reason: "admin_user_exists" });
    return;
  }

  console.log("[create-admin] plano", JSON.stringify({ create: 1, email: "[email]", username, role }));
  if (context.dryRun) {
    context.printExecutionHint();
    context.logResult({ created: 0, dryRun: true });
    return;
  }
  context.assertCanExecute();

  const password = await askHidden("Senha do administrador: ");
  const passwordConfirm = await askHidden("Confirme a senha: ");
  if (password !== passwordConfirm) {
    throw new Error("As senhas nao conferem.");
  }
  if (password.length < 12) {
    throw new Error("A senha deve ter pelo menos 12 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const created = await prisma.$transaction((tx) => {
    return tx.adminUser.create({
      data: {
        email,
        username,
        role,
        passwordHash,
      },
      select: {
        id: true,
        role: true,
      },
    });
  });

  context.logResult({ created: 1, id: created.id, role: created.role });
};

main()
  .catch((error) => {
    console.error(redactConsoleMessage(error.message));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
