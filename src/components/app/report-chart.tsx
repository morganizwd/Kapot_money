"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, minorToMajor } from "@/lib/finance/money";
import type { DailyReportRow } from "@/lib/finance/reporting";
import type { CategoryReportRow } from "@/lib/types";

const colors = ["#5b67f1", "#4f7df3", "#28a86b", "#d9902f", "#e25555", "#5c9fa8", "#9b79d4"];

type DistributionChartVariant = "donut" | "bar";

export function ReportChart({
  rows,
  currencyCode,
  variant,
}: {
  rows: CategoryReportRow[];
  currencyCode: string;
  variant: DistributionChartVariant;
}) {
  if (variant === "bar") {
    const chartRows = rows.slice(0, 8);
    return (
      <div className="h-72 w-full" role="img" aria-label="Столбчатая диаграмма по категориям">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(value) => formatCompactMoney(value, currencyCode)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="category_name"
              width={104}
              tick={{ fontSize: 12, fill: "var(--foreground)" }}
              tickFormatter={(value) => truncateLabel(String(value))}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => formatMoney(Number(value ?? 0), currencyCode)}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="amount_minor" radius={[0, 6, 6, 0]}>
              {chartRows.map((row, index) => <Cell key={row.category_id} fill={colors[index % colors.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-64 w-full" role="img" aria-label="Кольцевая диаграмма по категориям">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="amount_minor" nameKey="category_name" innerRadius={62} outerRadius={98} paddingAngle={3} stroke="none">
            {rows.map((row, index) => <Cell key={row.category_id} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip
            formatter={(value) => formatMoney(Number(value ?? 0), currencyCode)}
            contentStyle={tooltipStyle}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportTimelineChart({ rows, currencyCode }: { rows: DailyReportRow[]; currencyCode: string }) {
  const hasData = rows.some((row) => row.income_minor > 0 || row.expense_minor > 0);

  if (!hasData) {
    return null;
  }

  return (
    <div className="h-72 w-full" role="img" aria-label="Линейный график доходов и расходов по дням">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 12, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            minTickGap={28}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(value) => formatCompactMoney(value, currencyCode)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value ?? 0), currencyCode)}
            contentStyle={tooltipStyle}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Area type="monotone" dataKey="income_minor" name="Доходы" stroke="#28a86b" fill="#28a86b" fillOpacity={0.14} strokeWidth={2.5} />
          <Area type="monotone" dataKey="expense_minor" name="Расходы" stroke="#e25555" fill="#e25555" fillOpacity={0.1} strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  borderColor: "var(--border)",
  background: "var(--panel)",
  color: "var(--foreground)",
};

function formatCompactMoney(value: number, currencyCode: string) {
  return new Intl.NumberFormat("ru-BY", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(minorToMajor(Math.round(value), currencyCode)));
}

function truncateLabel(value: string) {
  return value.length > 14 ? `${value.slice(0, 13)}...` : value;
}
