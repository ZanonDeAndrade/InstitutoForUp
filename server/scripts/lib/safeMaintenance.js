const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

const parseArgs = (argv = process.argv.slice(2)) => {
  const values = {};
  const flags = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

    const [rawName, inlineValue] = arg.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      values[rawName] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      values[rawName] = next;
      index += 1;
    } else {
      flags.add(rawName);
    }
  }

  return {
    get: (name) => values[name],
    has: (name) => flags.has(name) || values[name] === "true",
    values,
    flags,
  };
};

const redactDatabaseUrl = (value) => {
  if (!value) return "[missing]";
  try {
    const url = new URL(value);
    const auth = url.username || url.password ? "[user]:[password]@" : "";
    return `${url.protocol}//${auth}${url.host}${url.pathname}${url.search}`;
  } catch {
    return "[invalid-url]";
  }
};

const getDatabaseInfo = (env = process.env) => {
  const rawUrl = env.DATABASE_URL || "";
  try {
    const url = new URL(rawUrl);
    const databaseName = url.pathname.replace(/^\//, "") || "[unknown-db]";
    const host = url.hostname || "[unknown-host]";
    return {
      rawUrl,
      redactedUrl: redactDatabaseUrl(rawUrl),
      protocol: url.protocol,
      host,
      databaseName,
      isLocal: localHosts.has(host),
      isPostgres: url.protocol === "postgresql:" || url.protocol === "postgres:",
    };
  } catch {
    return {
      rawUrl,
      redactedUrl: redactDatabaseUrl(rawUrl),
      protocol: "",
      host: "",
      databaseName: "",
      isLocal: false,
      isPostgres: false,
    };
  }
};

const createMaintenanceContext = ({
  scriptName,
  destructive = false,
  argv = process.argv.slice(2),
  env = process.env,
} = {}) => {
  if (!scriptName) throw new Error("scriptName is required");

  const args = parseArgs(argv);
  const db = getDatabaseInfo(env);
  const nodeEnv = env.NODE_ENV || "development";
  const execute = args.has("execute");
  const dryRun = args.has("dry-run") || !execute;
  const requiresStrongConfirmation = nodeEnv === "production" || !db.isLocal;
  const confirmationPhrase = `${scriptName}:${db.host}:${db.databaseName}`;
  const productionConfirmationPhrase = `production:${scriptName}:${db.databaseName}`;

  const assertValidDatabase = () => {
    if (!db.rawUrl || !db.isPostgres) {
      throw new Error("DATABASE_URL deve ser uma URL PostgreSQL valida antes de executar scripts de manutencao.");
    }
  };

  const assertCanExecute = () => {
    assertValidDatabase();
    if (dryRun) return;

    if (destructive && !args.has("allow-destructive")) {
      throw new Error(`Operacao destrutiva bloqueada. Reexecute com --allow-destructive apos revisar o plano.`);
    }

    if (requiresStrongConfirmation && args.get("confirm") !== confirmationPhrase) {
      throw new Error(`Confirmacao obrigatoria. Reexecute com --confirm ${confirmationPhrase}`);
    }

    if (nodeEnv === "production" && args.get("confirm-production") !== productionConfirmationPhrase) {
      throw new Error(
        `Confirmacao adicional de producao obrigatoria. Reexecute com --confirm-production ${productionConfirmationPhrase}`,
      );
    }
  };

  const printBanner = () => {
    console.log(`[maintenance:${scriptName}] mode=${dryRun ? "dry-run" : "execute"}`);
    console.log(`[maintenance:${scriptName}] nodeEnv=${nodeEnv}`);
    console.log(`[maintenance:${scriptName}] database=${db.redactedUrl}`);
    console.log(`[maintenance:${scriptName}] destructive=${destructive ? "yes" : "no"}`);
    if (dryRun) {
      console.log(`[maintenance:${scriptName}] nenhuma alteracao sera gravada sem --execute`);
    }
  };

  const printExecutionHint = () => {
    const parts = ["--execute"];
    if (destructive) parts.push("--allow-destructive");
    if (requiresStrongConfirmation) parts.push("--confirm", confirmationPhrase);
    if (nodeEnv === "production") parts.push("--confirm-production", productionConfirmationPhrase);
    console.log(`[maintenance:${scriptName}] para executar: ${parts.join(" ")}`);
  };

  const logResult = (result) => {
    console.log(`[maintenance:${scriptName}] resultado`, JSON.stringify(result));
  };

  return {
    args,
    db,
    nodeEnv,
    destructive,
    dryRun,
    execute,
    requiresStrongConfirmation,
    confirmationPhrase,
    productionConfirmationPhrase,
    assertValidDatabase,
    assertCanExecute,
    printBanner,
    printExecutionHint,
    logResult,
  };
};

module.exports = {
  createMaintenanceContext,
  getDatabaseInfo,
  parseArgs,
  redactDatabaseUrl,
};
