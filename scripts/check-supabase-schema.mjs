import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readEnvFile(fileName) {
  try {
    return readFileSync(resolve(fileName), "utf8");
  } catch {
    return "";
  }
}

function parseEnv(contents) {
  const env = {};

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/);

    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }

  return env;
}

const fileEnv = {
  ...parseEnv(readEnvFile(".env")),
  ...parseEnv(readEnvFile(".env.local")),
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  fileEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !publishableKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(1);
}

const checks = [
  {
    name: "RPC ensure_user_foundation",
    url: `${supabaseUrl}/rest/v1/rpc/ensure_user_foundation`,
    method: "POST",
    body: "{}",
    missingCode: "PGRST202",
    allowRestricted: true,
  },
  {
    name: "table user_profiles",
    url: `${supabaseUrl}/rest/v1/user_profiles?select=id&limit=1`,
    method: "GET",
    missingCode: "PGRST205",
  },
  {
    name: "table finance_books",
    url: `${supabaseUrl}/rest/v1/finance_books?select=id&limit=1`,
    method: "GET",
    missingCode: "PGRST205",
  },
  {
    name: "table wallets",
    url: `${supabaseUrl}/rest/v1/wallets?select=id&limit=1`,
    method: "GET",
    missingCode: "PGRST205",
  },
  {
    name: "table categories",
    url: `${supabaseUrl}/rest/v1/categories?select=id&limit=1`,
    method: "GET",
    missingCode: "PGRST205",
  },
];

let failed = false;

for (const check of checks) {
  const response = await fetch(check.url, {
    method: check.method,
    headers: {
      apikey: publishableKey,
      authorization: `Bearer ${publishableKey}`,
      "content-type": "application/json",
    },
    body: check.body,
  });
  const body = await response.text();
  let parsed = {};

  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { message: body };
  }

  const isMissing = parsed.code === check.missingCode;
  const isRestricted = isMissing && check.allowRestricted;
  failed ||= isMissing && !isRestricted;
  const status = isRestricted ? "restricted" : isMissing ? "missing" : "visible";
  console.log(`${status.padEnd(7)} ${check.name} HTTP ${response.status} ${parsed.code ?? ""} ${parsed.message ?? ""}`);
}

if (failed) {
  console.error("\nSupabase schema is not applied to the project from .env.local or is not exposed to the Data API roles.");
  process.exit(1);
}

console.log("\nSupabase schema is visible to PostgREST. A restricted RPC is OK when it is granted only to authenticated users.");
