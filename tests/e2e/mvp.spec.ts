import { expect, test } from "@playwright/test";

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);

test.describe("MVP finance flow", () => {
  test.skip(!supabaseConfigured, "Supabase env is required for real auth and persistence.");

  test("registers, creates wallet, adds money movements and logs out", async ({ page }) => {
    const suffix = crypto.randomUUID();
    const email = `e2e-${suffix}@example.com`;
    const password = `Password-${suffix}`;

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Пароль").fill(password);
    await page.getByLabel("Повтор пароля").fill(password);
    await page.getByRole("button", { name: /Зарегистрироваться/ }).click();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Пароль").fill(password);
    await page.getByRole("button", { name: /Войти/ }).click();
    await expect(page.getByRole("heading", { name: /Личные финансы|Первый финансовый профиль/ })).toBeVisible();

    await page.goto("/app/wallets");
    await page.getByLabel("Название").first().fill("Priorbank");
    await page.getByLabel("Начальный остаток").fill("500");
    await page.getByRole("button", { name: /Создать кошелёк/ }).click();
    await expect(page.getByText("Кошелёк создан.")).toBeVisible();

    await page.goto("/app/transactions");
    await page.getByRole("button", { name: "Доход" }).click();
    await page.getByLabel("Сумма").fill("3000");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText("Доход сохранен.")).toBeVisible();

    await page.getByRole("button", { name: "Расход" }).click();
    await page.getByLabel("Сумма").fill("120");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText("Расход сохранен.")).toBeVisible();

    await page.getByLabel("Выйти").click();
    await expect(page).toHaveURL(/\/login/);
  });
});
