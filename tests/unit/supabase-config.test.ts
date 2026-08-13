import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl } from "@/lib/supabase/config";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalPublicVercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
const originalVercelUrl = process.env.VERCEL_URL;

afterEach(() => {
  restoreEnv("NEXT_PUBLIC_SITE_URL", originalSiteUrl);
  restoreEnv("NEXT_PUBLIC_VERCEL_URL", originalPublicVercelUrl);
  restoreEnv("VERCEL_URL", originalVercelUrl);
});

describe("getSiteUrl", () => {
  it("prefers the configured canonical URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://money.example.com/";
    process.env.VERCEL_URL = "preview.vercel.app";

    expect(getSiteUrl()).toBe("https://money.example.com");
  });

  it("uses the Vercel deployment URL when no canonical URL is configured", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_URL = "kapot-money.vercel.app";

    expect(getSiteUrl()).toBe("https://kapot-money.vercel.app");
  });

  it("uses localhost only outside a configured deployment", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    delete process.env.VERCEL_URL;

    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
