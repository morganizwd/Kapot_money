import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const runIntegration = Boolean(supabaseUrl && anonKey && serviceRoleKey);

describe.skipIf(!runIntegration)("Supabase RLS", () => {
  it("keeps Alice's finance data and relations inaccessible to Bob", async () => {
    const admin = createClient<Database>(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const suffix = crypto.randomUUID();
    const password = `Password-${suffix}`;

    const alice = await admin.auth.admin.createUser({ email: `alice-${suffix}@example.com`, password, email_confirm: true });
    const bob = await admin.auth.admin.createUser({ email: `bob-${suffix}@example.com`, password, email_confirm: true });

    expect(alice.error).toBeNull();
    expect(bob.error).toBeNull();

    try {
      const aliceClient = createClient<Database>(supabaseUrl!, anonKey!, { auth: { autoRefreshToken: false, persistSession: false } });
      const bobClient = createClient<Database>(supabaseUrl!, anonKey!, { auth: { autoRefreshToken: false, persistSession: false } });

      await aliceClient.auth.signInWithPassword({ email: `alice-${suffix}@example.com`, password });
      await bobClient.auth.signInWithPassword({ email: `bob-${suffix}@example.com`, password });

      const { data: aliceBookId, error: aliceFoundationError } = await aliceClient.rpc("ensure_user_foundation");
      const { data: bobBookId, error: bobFoundationError } = await bobClient.rpc("ensure_user_foundation");
      expect(aliceFoundationError).toBeNull();
      expect(bobFoundationError).toBeNull();
      expect(aliceBookId).toBeTruthy();
      expect(bobBookId).toBeTruthy();

      const { data: aliceWallet, error: aliceWalletError } = await aliceClient
        .from("wallets")
        .insert({ book_id: aliceBookId!, name: "Priorbank", type: "bank_card", currency_code: "BYN", opening_balance_minor: 500000, opening_balance_date: "2026-08-13" })
        .select("id")
        .single();
      const { data: bobWallet, error: bobWalletError } = await bobClient
        .from("wallets")
        .insert({ book_id: bobBookId!, name: "Bob wallet", type: "bank_card", currency_code: "BYN", opening_balance_minor: 0, opening_balance_date: "2026-08-13" })
        .select("id")
        .single();
      expect(aliceWalletError).toBeNull();
      expect(bobWalletError).toBeNull();
      expect(aliceWallet?.id).toBeTruthy();
      expect(bobWallet?.id).toBeTruthy();

      const { data: aliceCategory, error: aliceCategoryError } = await aliceClient
        .from("categories")
        .select("id")
        .eq("book_id", aliceBookId!)
        .eq("kind", "income")
        .limit(1)
        .single();
      expect(aliceCategoryError).toBeNull();
      expect(aliceCategory?.id).toBeTruthy();

      const { data: aliceTransactionId, error: aliceTransactionError } = await aliceClient.rpc("create_financial_transaction", {
        p_book_id: aliceBookId!,
        p_kind: "income",
        p_category_id: aliceCategory!.id,
        p_description: "Alice salary",
        p_note: null,
        p_occurred_at: "2026-08-13T12:00:00.000Z",
        p_entries: [{ wallet_id: aliceWallet!.id, amount_minor: "10000", currency_code: "BYN" }],
        p_reporting_amount_minor: null,
        p_exchange_rate: null,
        p_idempotency_key: crypto.randomUUID(),
      });
      expect(aliceTransactionError).toBeNull();
      expect(aliceTransactionId).toBeTruthy();

      const reads = await Promise.all([
        bobClient.from("finance_books").select("id").eq("id", aliceBookId!),
        bobClient.from("wallets").select("id").eq("id", aliceWallet!.id),
        bobClient.from("categories").select("id").eq("id", aliceCategory!.id),
        bobClient.from("transactions").select("id").eq("id", aliceTransactionId!),
        bobClient.from("transaction_entries").select("id").eq("transaction_id", aliceTransactionId!),
      ]);
      for (const read of reads) {
        expect(read.error).toBeNull();
        expect(read.data).toEqual([]);
      }

      const { data: bobTransaction, error: bobTransactionError } = await bobClient
        .from("transactions")
        .insert({ book_id: bobBookId!, kind: "adjustment", description: "Bob adjustment" })
        .select("id")
        .single();
      expect(bobTransactionError).toBeNull();
      expect(bobTransaction?.id).toBeTruthy();

      const { error: crossBookEntryError } = await bobClient.from("transaction_entries").insert({
        transaction_id: bobTransaction!.id,
        wallet_id: aliceWallet!.id,
        amount_minor: 100,
        currency_code: "BYN",
      });
      expect(crossBookEntryError).not.toBeNull();
    } finally {
      if (alice.data.user) await admin.auth.admin.deleteUser(alice.data.user.id);
      if (bob.data.user) await admin.auth.admin.deleteUser(bob.data.user.id);
    }
  });
});
