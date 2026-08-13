import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import { formatMoney } from "@/lib/finance/money";
import { formatReportDateLong, getTransactionAmountMinor, type DailyReportRow } from "@/lib/finance/reporting";
import type { CategoryReportRow, FinanceBook, PeriodSummary, TransactionListItem } from "@/lib/types";

export type ReportPdfSections = {
  summary: boolean;
  expenses: boolean;
  income: boolean;
  dynamics: boolean;
  operations: boolean;
};

export type ReportPdfPayload = {
  book: Pick<FinanceBook, "name" | "base_currency">;
  periodLabel: string;
  summary: PeriodSummary;
  expenseRows: CategoryReportRow[];
  incomeRows: CategoryReportRow[];
  dailyRows: DailyReportRow[];
  transactions: TransactionListItem[];
  sections: ReportPdfSections;
  orientation: "portrait" | "landscape";
};

export async function downloadReportPdf(payload: ReportPdfPayload) {
  const [pdfMakeModule, pdfFonts] = await Promise.all([
    import("pdfmake/build/pdfmake.js"),
    import("pdfmake/build/vfs_fonts.js"),
  ]);
  const pdfMake = pdfMakeModule.default;

  pdfMake.addVirtualFileSystem(pdfFonts.default);
  await pdfMake.createPdf(createReportPdfDefinition(payload)).download(createFileName(payload.periodLabel));
}

export function createReportPdfDefinition(payload: ReportPdfPayload): TDocumentDefinitions {
  const content: Content[] = [
    { text: payload.book.name, style: "bookName" },
    { text: "Финансовый отчёт", style: "title" },
    { text: capitalize(payload.periodLabel), style: "period" },
  ];

  if (payload.sections.summary) {
    content.push(summarySection(payload.summary, payload.book.base_currency));
  }
  if (payload.sections.expenses) {
    content.push(categorySection("Расходы по категориям", payload.expenseRows, payload.book.base_currency));
  }
  if (payload.sections.income) {
    content.push(categorySection("Доходы по категориям", payload.incomeRows, payload.book.base_currency));
  }
  if (payload.sections.dynamics) {
    content.push(dynamicsSection(payload.dailyRows, payload.book.base_currency));
  }
  if (payload.sections.operations) {
    content.push(operationsSection(payload.transactions, payload.book.base_currency));
  }

  return {
    pageSize: "A4",
    pageOrientation: payload.orientation,
    pageMargins: [36, 42, 36, 42],
    info: {
      title: `Финансовый отчёт - ${payload.periodLabel}`,
      author: payload.book.name,
      subject: "Личные финансы",
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      color: "#172033",
    },
    styles: {
      bookName: { fontSize: 9, color: "#65728a" },
      title: { fontSize: 22, bold: true, margin: [0, 4, 0, 2] },
      period: { fontSize: 10, color: "#65728a", margin: [0, 0, 0, 20] },
      section: { fontSize: 13, bold: true, margin: [0, 18, 0, 8] },
      tableHeader: { bold: true, color: "#46536b" },
      amount: { alignment: "right" },
    },
    footer: (currentPage, pageCount) => ({
      text: `Страница ${currentPage} из ${pageCount}`,
      alignment: "right",
      margin: [0, 0, 36, 12],
      fontSize: 8,
      color: "#65728a",
    }),
    content,
  };
}

function summarySection(summary: PeriodSummary, currencyCode: string): Content {
  return {
    table: {
      widths: ["*", "auto"],
      body: [
        [{ text: "Доходы", fillColor: "#eef9f2" }, { text: formatMoney(summary.income_minor, currencyCode), alignment: "right", fillColor: "#eef9f2" }],
        [{ text: "Расходы", fillColor: "#fff0f0" }, { text: formatMoney(summary.expense_minor, currencyCode), alignment: "right", fillColor: "#fff0f0" }],
        [{ text: "Денежный поток", bold: true, fillColor: "#eef0ff" }, { text: formatMoney(summary.cash_flow_minor, currencyCode), bold: true, alignment: "right", fillColor: "#eef0ff" }],
      ],
    },
    layout: tableLayout(),
  };
}

function categorySection(title: string, rows: CategoryReportRow[], currencyCode: string): Content[] {
  const total = rows.reduce((sum, row) => sum + row.amount_minor, 0);
  const body: TableCell[][] = [
    [headerCell("Категория"), headerAmountCell("Сумма"), headerAmountCell("Доля")],
    ...rows.map((row) => [
      textCell(row.category_name),
      amountCell(formatMoney(row.amount_minor, currencyCode)),
      amountCell(`${total > 0 ? Math.round((row.amount_minor / total) * 100) : 0}%`),
    ]),
  ];

  return [
    { text: title, style: "section" },
    rows.length > 0
      ? {
          table: {
            headerRows: 1,
            widths: ["*", "auto", 46],
            body,
          },
          layout: tableLayout(),
        }
      : { text: "Нет операций за период.", color: "#65728a" },
  ];
}

function dynamicsSection(rows: DailyReportRow[], currencyCode: string): Content[] {
  const rowsWithActivity = rows.filter((row) => row.income_minor > 0 || row.expense_minor > 0);
  const body: TableCell[][] = [
    [headerCell("Дата"), headerAmountCell("Доходы"), headerAmountCell("Расходы"), headerAmountCell("Поток")],
    ...rowsWithActivity.map((row) => [
      textCell(formatReportDateLong(row.date)),
      amountCell(formatMoney(row.income_minor, currencyCode)),
      amountCell(formatMoney(row.expense_minor, currencyCode)),
      amountCell(formatMoney(row.cash_flow_minor, currencyCode)),
    ]),
  ];

  return [
    { text: "Динамика по дням", style: "section" },
    rowsWithActivity.length > 0
      ? {
          table: {
            headerRows: 1,
            widths: ["auto", "*", "*", "*"],
            body,
          },
          layout: tableLayout(),
        }
      : { text: "Нет операций за период.", color: "#65728a" },
  ];
}

function operationsSection(transactions: TransactionListItem[], currencyCode: string): Content[] {
  const rows = transactions.filter((transaction) => transaction.kind === "income" || transaction.kind === "expense");
  const body: TableCell[][] = [
    [headerCell("Дата"), headerCell("Тип"), headerCell("Категория"), headerAmountCell("Сумма")],
    ...rows.map((transaction) => [
      textCell(formatReportDateLong(transaction.occurred_at.slice(0, 10))),
      textCell(transaction.kind === "income" ? "Доход" : "Расход"),
      textCell(transaction.categories?.name ?? "Без категории"),
      amountCell(formatMoney(getTransactionAmountMinor(transaction), currencyCode)),
    ]),
  ];

  return [
    { text: "Операции", style: "section", pageBreak: "before" },
    rows.length > 0
      ? {
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "*", "auto"],
            body,
          },
          layout: tableLayout(),
        }
      : { text: "Нет операций за период.", color: "#65728a" },
  ];
}

function tableLayout() {
  return {
    hLineColor: () => "#dfe4ee",
    vLineColor: () => "#dfe4ee",
    paddingLeft: () => 7,
    paddingRight: () => 7,
    paddingTop: () => 6,
    paddingBottom: () => 6,
  };
}

function textCell(text: string): TableCell {
  return { text } as TableCell;
}

function amountCell(text: string): TableCell {
  return { text, alignment: "right" } as TableCell;
}

function headerCell(text: string): TableCell {
  return { text, style: "tableHeader" } as TableCell;
}

function headerAmountCell(text: string): TableCell {
  return { text, style: ["tableHeader", "amount"] } as TableCell;
}

function capitalize(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function createFileName(periodLabel: string) {
  const safePeriod = periodLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-zа-я0-9-]/gi, "");
  return `kapot-money-report-${safePeriod || "report"}.pdf`;
}
