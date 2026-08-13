"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/finance/money";
import type { CategoryReportRow } from "@/lib/types";

const colors = ["#5b67f1", "#4f7df3", "#28a86b", "#d9902f", "#e25555", "#5c9fa8", "#9b79d4"];

export function ReportChart({ rows, currencyCode }: { rows: CategoryReportRow[]; currencyCode: string }) {
  return <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={rows} dataKey="amount_minor" nameKey="category_name" innerRadius={62} outerRadius={98} paddingAngle={3} stroke="none">{rows.map((row, index) => <Cell key={row.category_id} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => formatMoney(Number(value), currencyCode)} contentStyle={{ borderRadius: 12, borderColor: "var(--border)", background: "var(--panel)", color: "var(--foreground)" }} /></PieChart></ResponsiveContainer></div>;
}
