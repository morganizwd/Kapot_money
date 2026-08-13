import { z } from "zod";
import { commonCurrencies } from "@/lib/finance/currencies";

export const uuidSchema = z.uuid();

export const currencySchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().length(3));

export const moneyInputSchema = z
  .string()
  .trim()
  .min(1, "Введите сумму")
  .regex(/^\d+([,.]\d+)?$/, "Введите корректную сумму");

export const authSchema = z.object({
  email: z.email("Введите корректный email").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов"),
});

export const registerSchema = authSchema
  .extend({
    passwordConfirmation: z.string(),
    timezone: z.string().min(1).default("Europe/Minsk"),
    locale: z.string().min(1).default("ru"),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Пароли не совпадают",
  });

export const forgotPasswordSchema = z.object({
  email: z.email("Введите корректный email").transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Пароль должен быть не короче 8 символов"),
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Пароли не совпадают",
  });

export const financeBookSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(80),
  baseCurrency: currencySchema.default("BYN"),
  icon: z.string().trim().max(40).optional(),
});

export const walletSchema = z.object({
  bookId: uuidSchema,
  name: z.string().trim().min(1, "Введите название").max(80),
  type: z.enum([
    "cash",
    "bank_card",
    "bank_account",
    "savings",
    "deposit",
    "ewallet",
    "credit",
    "receivable",
    "liability",
    "other",
  ]),
  currencyCode: currencySchema.default("BYN"),
  openingBalance: moneyInputSchema.default("0"),
  openingBalanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  includeInNetWorth: z.coerce.boolean().default(true),
});

export const categorySchema = z.object({
  bookId: uuidSchema,
  name: z.string().trim().min(1, "Введите название").max(80),
  kind: z.enum(["income", "expense"]),
  parentId: z.union([uuidSchema, z.literal("")]).optional().transform((value) => (value ? value : null)),
  icon: z.string().trim().max(40).optional().transform((value) => value || null),
});

export const transactionSchema = z.object({
  bookId: uuidSchema,
  kind: z.enum(["income", "expense", "transfer", "adjustment"]),
  categoryId: z.union([uuidSchema, z.literal("")]).optional().transform((value) => (value ? value : null)),
  sourceWalletId: z.union([uuidSchema, z.literal("")]).optional().transform((value) => (value ? value : null)),
  destinationWalletId: z.union([uuidSchema, z.literal("")]).optional().transform((value) => (value ? value : null)),
  amount: moneyInputSchema,
  receivedAmount: z.union([moneyInputSchema, z.literal("")]).optional(),
  currencyCode: currencySchema,
  destinationCurrencyCode: currencySchema.optional(),
  description: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
  occurredAt: z.string().min(1),
});

export const budgetSchema = z.object({
  bookId: uuidSchema,
  categoryId: uuidSchema,
  amount: moneyInputSchema,
  currencyCode: currencySchema,
  period: z.enum(["monthly", "yearly", "custom"]).default("monthly"),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsOn: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional(),
});

export const settingsSchema = z.object({
  displayName: z.string().trim().max(80).optional(),
  defaultCurrency: z.enum(commonCurrencies).or(currencySchema),
  timezone: z.string().trim().min(1).max(80),
  locale: z.string().trim().min(1).max(12),
});

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
