import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, PiggyBank } from "lucide-react";
import { CategoryIcon } from "@/components/app/category-icon";
import { FinanceFlow } from "@/components/app/finance-flow";
import { MoneyAmount, PageContainer, SectionHeader } from "@/components/app/mobile-ui";
import { TransactionList } from "@/components/app/transaction-list";
import { BookForm } from "@/components/forms/book-form";
import { Card, CardContent } from "@/components/ui/card";
import { getBudgetProgress } from "@/lib/data/budgets";
import { getActiveBook, getFinanceBooks } from "@/lib/data/books";
import { getCategories } from "@/lib/data/categories";
import { getUserProfile } from "@/lib/data/profile";
import { getCategoryReport, getPeriodSummary } from "@/lib/data/reports";
import { getTransactions } from "@/lib/data/transactions";
import { getWalletBalances } from "@/lib/data/wallets";
import { endOfCurrentMonth, startOfCurrentMonth } from "@/lib/utils";

export const metadata: Metadata = { title: "Главная" };

type AppPageProps = { searchParams?: Promise<{ book?: string | string[] }> };

export default async function AppPage({ searchParams }: AppPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedBookId = Array.isArray(params.book) ? params.book[0] : params.book;
  const [book, books, profile] = await Promise.all([getActiveBook(requestedBookId), getFinanceBooks(), getUserProfile()]);

  if (!book) {
    return <PageContainer className="grid min-h-[70dvh] place-items-center"><Card className="w-full max-w-md"><CardContent><div className="mb-6"><p className="text-sm font-semibold text-primary">Начало работы</p><h1 className="mt-2 text-2xl font-bold">Создайте финансовый профиль</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">В нём будут храниться кошельки, категории и все операции.</p></div><BookForm /></CardContent></Card></PageContainer>;
  }

  const monthFrom = startOfCurrentMonth().toISOString();
  const monthTo = endOfCurrentMonth().toISOString();
  const [wallets, categories, transactions, summary, budgets, expenseCategories] = await Promise.all([
    getWalletBalances(book.id),
    getCategories(book.id),
    getTransactions(book.id, { from: monthFrom, to: monthTo }),
    getPeriodSummary(book.id, monthFrom, monthTo),
    getBudgetProgress(book.id),
    getCategoryReport(book.id, monthFrom, monthTo, "expense"),
  ]);

  const balances = wallets.filter((wallet) => wallet.include_in_net_worth).reduce<Record<string, bigint>>((acc, wallet) => {
    acc[wallet.currency_code] = (acc[wallet.currency_code] ?? 0n) + BigInt(wallet.current_balance_minor);
    return acc;
  }, {});
  const mainBalance = balances[book.base_currency] ?? 0n;
  const name = profile?.display_name?.trim().split(/\s+/)[0];
  const month = new Intl.DateTimeFormat("ru-BY", { month: "long", year: "numeric" }).format(new Date());
  const expenseTotal = BigInt(Math.max(1, summary.expense_minor));

  return (
    <PageContainer className="grid gap-7">
      <header className="flex items-start justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">{name ? `Добрый день, ${name}` : "Добрый день"}</p><h1 className="mt-1 text-[1.75rem] font-bold leading-tight">{book.name}</h1></div>
        {books.length > 1 ? <Link href="/app/settings" className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-control)] bg-muted px-3 text-sm font-semibold text-muted-foreground">Профили<ChevronRight aria-hidden className="size-4" /></Link> : null}
      </header>

      <section className="rounded-[var(--radius-card)] bg-primary px-5 py-5 text-primary-foreground shadow-sm sm:px-6 sm:py-6">
        <p className="text-sm font-medium text-primary-foreground/75">Общий баланс</p>
        <MoneyAmount amountMinor={mainBalance} currencyCode={book.base_currency} className="mt-2 text-[2.25rem] font-bold leading-none text-primary-foreground sm:text-4xl [&>span:last-child]:text-primary-foreground/70" />
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-primary-foreground/15 pt-4 text-sm">
          <span className="text-primary-foreground/75">Доходы − расходы</span>
          <MoneyAmount amountMinor={summary.cash_flow_minor} currencyCode={book.base_currency} sign="auto" className="font-semibold text-primary-foreground [&>span:last-child]:text-primary-foreground/70" />
        </div>
        {Object.keys(balances).length > 1 ? <div className="mt-3 flex flex-wrap gap-2">{Object.entries(balances).filter(([currency]) => currency !== book.base_currency).map(([currency, amount]) => <span key={currency} className="rounded-full bg-primary-foreground/10 px-2.5 py-1 text-xs font-semibold"><MoneyAmount amountMinor={amount} currencyCode={currency} className="text-primary-foreground [&>span:last-child]:text-primary-foreground/70" /></span>)}</div> : null}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold capitalize text-muted-foreground">{month}</p><Link href="/app/reports" className="text-sm font-semibold text-primary">Отчёты</Link></div>
        <div className="grid grid-cols-2 gap-3">
          <SummaryTile label="Доходы" amount={summary.income_minor} currency={book.base_currency} tone="income" />
          <SummaryTile label="Расходы" amount={summary.expense_minor} currency={book.base_currency} tone="expense" />
        </div>
      </section>

      <FinanceFlow book={book} wallets={wallets} categories={categories} />

      <section className="grid gap-7 lg:grid-cols-2 lg:gap-6">
        <div>
          <SectionHeader title="Расходы" action={<Link href="/app/reports" className="text-sm font-semibold text-primary">Подробнее</Link>} />
          {expenseCategories.length === 0 ? <DashboardEmpty title="Пока нет расходов" description="Добавьте первую операцию, и здесь появится структура трат." /> : <div className="mt-3 grid gap-4">{expenseCategories.slice(0, 4).map((category) => <div key={category.category_id}><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-muted text-primary"><CategoryIcon name={category.category_name} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{category.category_name}</span><span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Number((BigInt(category.amount_minor) * 100n) / expenseTotal))}%` }} /></span></span><MoneyAmount amountMinor={category.amount_minor} currencyCode={book.base_currency} className="text-sm font-semibold" /></div></div>)}</div>}
        </div>
        <div>
          <SectionHeader title="Бюджеты" action={<Link href="/app/budgets" className="text-sm font-semibold text-primary">Все</Link>} />
          {budgets.length === 0 ? <DashboardEmpty title="Нет активных бюджетов" description="Лимиты помогают держать расходы под контролем." href="/app/budgets" /> : <div className="mt-3 grid gap-3">{budgets.slice(0, 3).map((budget) => <div key={budget.budget_id} className="rounded-[var(--radius-control)] bg-muted p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{budget.category_name}</span><span className="text-xs font-semibold text-muted-foreground">{Math.round(budget.progress_percent)}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-panel"><div className={budget.progress_percent > 90 ? "h-full rounded-full bg-danger" : budget.progress_percent > 70 ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-primary"} style={{ width: `${Math.min(100, budget.progress_percent)}%` }} /></div><div className="mt-2 flex justify-between gap-2 text-xs text-muted-foreground"><span>Потрачено</span><MoneyAmount amountMinor={budget.spent_minor} currencyCode={budget.currency_code} className="font-semibold" /></div></div>)}</div>}
        </div>
      </section>

      <section>
        <SectionHeader title="Последние операции" action={<Link href="/app/transactions" className="text-sm font-semibold text-primary">История</Link>} />
        <div className="mt-3"><TransactionList transactions={transactions.slice(0, 6)} book={book} wallets={wallets} categories={categories} stickyGroupHeaders={false} /></div>
      </section>
    </PageContainer>
  );
}

function SummaryTile({ label, amount, currency, tone }: { label: string; amount: number; currency: string; tone: "income" | "expense" }) {
  const Icon = tone === "income" ? ArrowUpRight : ArrowDownLeft;
  return <div className="rounded-[var(--radius-card)] bg-muted p-4"><span className={tone === "income" ? "grid size-9 place-items-center rounded-xl bg-success/10 text-success" : "grid size-9 place-items-center rounded-xl bg-danger/10 text-danger"}><Icon aria-hidden className="size-5" /></span><p className="mt-4 text-sm text-muted-foreground">{label}</p><MoneyAmount amountMinor={amount} currencyCode={currency} className={tone === "income" ? "mt-1 text-lg font-bold text-success" : "mt-1 text-lg font-bold text-danger"} /></div>;
}

function DashboardEmpty({ title, description, href }: { title: string; description: string; href?: string }) {
  return <div className="mt-3 rounded-[var(--radius-control)] bg-muted px-4 py-5"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-panel text-primary"><PiggyBank aria-hidden className="size-5" /></span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>{href ? <Link href={href} className="mt-3 inline-flex text-sm font-semibold text-primary">Открыть</Link> : null}</div></div></div>;
}
