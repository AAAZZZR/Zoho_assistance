/**
 * revenue-report.ts - Revenue summary grouped by period
 *
 * Usage:
 *   npx tsx revenue-report.ts                          # Current year, monthly
 *   npx tsx revenue-report.ts --year 2024              # Specific year
 *   npx tsx revenue-report.ts --period quarterly       # Quarterly breakdown
 *   npx tsx revenue-report.ts --from 2024-01-01 --to 2024-06-30
 */

import { zohoGet, currency, parseArgs } from "./auth";

function getMonthKey(date: string): string {
  return date.substring(0, 7); // "2024-03"
}

function getQuarterKey(date: string): string {
  const month = parseInt(date.substring(5, 7));
  const q = Math.ceil(month / 3);
  return `${date.substring(0, 4)}-Q${q}`;
}

async function main() {
  const args = parseArgs(process.argv);
  const year = args.year || new Date().getFullYear().toString();
  const period = args.period || "monthly"; // monthly | quarterly

  const dateFrom = args.from || `${year}-01-01`;
  const dateTo = args.to || `${year}-12-31`;

  // Fetch paid invoices in date range
  const data = await zohoGet("invoices", {
    status: "paid",
    date_start: dateFrom,
    date_end: dateTo,
  });
  const invoices = data.invoices || [];

  // Also fetch partially paid
  const partialData = await zohoGet("invoices", {
    status: "partially_paid",
    date_start: dateFrom,
    date_end: dateTo,
  });
  const allInvoices = [...invoices, ...(partialData.invoices || [])];

  if (!allInvoices.length) {
    console.log(`No paid invoices found for ${dateFrom} to ${dateTo}`);
    return;
  }

  // Group by period
  const groups = new Map<string, { count: number; total: number }>();
  const keyFn = period === "quarterly" ? getQuarterKey : getMonthKey;

  for (const inv of allInvoices) {
    const key = keyFn(inv.date);
    const existing = groups.get(key) || { count: 0, total: 0 };
    existing.count++;
    existing.total += inv.total || 0;
    groups.set(key, existing);
  }

  const sym = allInvoices[0]?.currency_symbol || "$";
  const grandTotal = allInvoices.reduce((s: number, i: any) => s + (i.total || 0), 0);

  console.log(`📈 Revenue Report (${dateFrom} to ${dateTo})`);
  console.log("=".repeat(50));
  console.log(`Total Revenue: ${currency(grandTotal, sym)} from ${allInvoices.length} invoice(s)\n`);

  const sorted = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const maxTotal = Math.max(...sorted.map(([, v]) => v.total));

  for (const [key, val] of sorted) {
    const barLen = maxTotal > 0 ? Math.round((val.total / maxTotal) * 20) : 0;
    const bar = "█".repeat(barLen) + "░".repeat(20 - barLen);
    console.log(`  ${key}  ${bar}  ${currency(val.total, sym)}  (${val.count} inv)`);
  }

  // Month-over-month change
  if (sorted.length >= 2) {
    console.log(`\n📊 Period-over-Period:`);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1][1].total;
      const curr = sorted[i][1].total;
      const change = prev > 0 ? (((curr - prev) / prev) * 100).toFixed(1) : "N/A";
      const arrow = curr >= prev ? "📈" : "📉";
      console.log(`  ${sorted[i - 1][0]} → ${sorted[i][0]}: ${arrow} ${change}%`);
    }
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
