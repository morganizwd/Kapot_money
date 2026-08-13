"use client";

import { useState } from "react";
import { FileDown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/app/mobile-ui";
import { Button } from "@/components/ui/button";
import { downloadReportPdf, type ReportPdfSections } from "@/lib/finance/report-pdf";
import type { DailyReportRow } from "@/lib/finance/reporting";
import type { CategoryReportRow, FinanceBook, PeriodSummary, TransactionListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const defaultSections: ReportPdfSections = {
  summary: true,
  expenses: true,
  income: true,
  dynamics: true,
  operations: false,
};

const sectionLabels: Array<{ key: keyof ReportPdfSections; label: string }> = [
  { key: "summary", label: "Сводка за месяц" },
  { key: "expenses", label: "Расходы по категориям" },
  { key: "income", label: "Доходы по категориям" },
  { key: "dynamics", label: "Динамика по дням" },
  { key: "operations", label: "Список операций" },
];

export function ReportPdfExport({
  book,
  periodLabel,
  summary,
  expenseRows,
  incomeRows,
  dailyRows,
  transactions,
}: {
  book: FinanceBook;
  periodLabel: string;
  summary: PeriodSummary;
  expenseRows: CategoryReportRow[];
  incomeRows: CategoryReportRow[];
  dailyRows: DailyReportRow[];
  transactions: TransactionListItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [sections, setSections] = useState<ReportPdfSections>(defaultSections);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [isGenerating, setIsGenerating] = useState(false);
  const selectedCount = Object.values(sections).filter(Boolean).length;

  const handleDownload = async () => {
    if (!selectedCount) {
      return;
    }

    setIsGenerating(true);
    try {
      await downloadReportPdf({
        book,
        periodLabel,
        summary,
        expenseRows,
        incomeRows,
        dailyRows,
        transactions,
        sections,
        orientation,
      });
      toast.success("PDF-отчёт скачан.");
      setIsOpen(false);
    } catch {
      toast.error("Не удалось подготовить PDF-отчёт. Попробуйте ещё раз.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="icon" title="Экспорт PDF" aria-label="Экспорт PDF" onClick={() => setIsOpen(true)}>
        <FileDown aria-hidden className="size-5" />
      </Button>
      {isOpen ? (
        <BottomSheet
          title="Экспорт PDF"
          onClose={() => !isGenerating && setIsOpen(false)}
          footer={(
            <Button className="w-full" disabled={!selectedCount || isGenerating} onClick={handleDownload}>
              {isGenerating ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : <FileDown aria-hidden className="size-5" />}
              {isGenerating ? "Подготавливаем PDF" : "Скачать PDF"}
            </Button>
          )}
        >
          <fieldset className="grid gap-1">
            <legend className="mb-2 text-sm font-semibold">Содержимое</legend>
            {sectionLabels.map(({ key, label }) => (
              <label key={key} className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-border py-2 last:border-0">
                <input
                  type="checkbox"
                  className="size-5 accent-primary"
                  checked={sections[key]}
                  onChange={() => setSections((current) => ({ ...current, [key]: !current[key] }))}
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="mt-6">
            <legend className="mb-2 text-sm font-semibold">Ориентация</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Ориентация PDF">
              <OrientationButton label="Книжная" value="portrait" selected={orientation === "portrait"} onClick={() => setOrientation("portrait")} />
              <OrientationButton label="Альбомная" value="landscape" selected={orientation === "landscape"} onClick={() => setOrientation("landscape")} />
            </div>
          </fieldset>
        </BottomSheet>
      ) : null}
    </>
  );
}

function OrientationButton({
  label,
  value,
  selected,
  onClick,
}: {
  label: string;
  value: "portrait" | "landscape";
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      value={value}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-[var(--radius-control)] border px-3 text-sm font-semibold transition",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-panel hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
