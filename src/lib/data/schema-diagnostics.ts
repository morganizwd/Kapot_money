import { cache } from "react";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/config";

export type SchemaDiagnostic = {
  name: string;
  status: "visible" | "restricted" | "missing" | "unknown";
  httpStatus: number | null;
  code: string | null;
  message: string;
};

type Check = {
  name: string;
  path: string;
  method: "GET" | "POST";
  body?: string;
  missingCode: string;
  allowRestricted?: boolean;
};

const checks: Check[] = [
  {
    name: "RPC ensure_user_foundation",
    path: "/rest/v1/rpc/ensure_user_foundation",
    method: "POST",
    body: "{}",
    missingCode: "PGRST202",
    allowRestricted: true,
  },
  {
    name: "table user_profiles",
    path: "/rest/v1/user_profiles?select=id&limit=1",
    method: "GET",
    missingCode: "PGRST205",
  },
  {
    name: "table finance_books",
    path: "/rest/v1/finance_books?select=id&limit=1",
    method: "GET",
    missingCode: "PGRST205",
  },
  {
    name: "table wallets",
    path: "/rest/v1/wallets?select=id&limit=1",
    method: "GET",
    missingCode: "PGRST205",
  },
  {
    name: "table categories",
    path: "/rest/v1/categories?select=id&limit=1",
    method: "GET",
    missingCode: "PGRST205",
  },
];

export const getSupabaseSchemaDiagnostics = cache(async (): Promise<SchemaDiagnostic[]> => {
  if (!isSupabaseConfigured()) {
    return [
      {
        name: "Supabase env",
        status: "missing",
        httpStatus: null,
        code: null,
        message: "NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY не настроены.",
      },
    ];
  }

  const headers = {
    apikey: getSupabasePublishableKey(),
    authorization: `Bearer ${getSupabasePublishableKey()}`,
    "content-type": "application/json",
  };

  return Promise.all(
    checks.map(async (check) => {
      try {
        const response = await fetch(`${getSupabaseUrl()}${check.path}`, {
          method: check.method,
          headers,
          body: check.body,
          cache: "no-store",
        });
        const text = await response.text();
        const parsed = parseJson(text);
        const code = typeof parsed.code === "string" ? parsed.code : null;
        const message = typeof parsed.message === "string" ? parsed.message : text;
        const isMissing = code === check.missingCode;
        const isRestricted = isMissing && check.allowRestricted;

        return {
          name: check.name,
          status: isRestricted ? "restricted" : isMissing ? "missing" : "visible",
          httpStatus: response.status,
          code,
          message,
        };
      } catch (error) {
        return {
          name: check.name,
          status: "unknown",
          httpStatus: null,
          code: null,
          message: error instanceof Error ? error.message : "Не удалось выполнить проверку.",
        };
      }
    }),
  );
});

function parseJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}
