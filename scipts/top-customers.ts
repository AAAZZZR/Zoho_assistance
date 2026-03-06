/**
 * top-customers.ts - Rank customers by total revenue
 *
 * Usage:
 *   npx tsx top-customers.ts                     # Top 10
 *   npx tsx top-customers.ts --limit 20          # Top 20
 *   npx tsx top-customers.ts --year 2024         # Only 2024 invoices
 *   npx tsx top-customers.ts --from 2024-01-01 --to 2024-06-30
 */

import { zohoGet, currency, parseArgs } from "./auth";

async function main() {
  const args = parseArgs(process.argv);
  const limit = parseInt(args.limit || "10");
  const year = args.year;

  const params: Record<string, string> = {};
  if (year) {
    params.date_start = args.from || `${year}-01-01`;
    params.date_end = args.to || `${year}-12-31`;
  } else if (args.from || args.to) {
    if (args.from) params.date_start = args.from;
    if (args.to) params.date_end = args.to;
  }

  // Fetch all paid invoices
  const paidData = await zohoGet("invoices", { ...params, status: "paid" });
  const partialData = await zohoGet("invoices", { ...params, status: "partially_paid" });
  const allInvoices = [
    ...(paidData.invoices || []),
    ...(partialData.invoices || []),
  ];

  if (!allInvoices.length) {
    console.log("No paid invoices found in the specified period.");
    return;
  }

  // Aggregate by customer
  const customers = new Map<
    string,
    { name: string; total: number; count: number; symbol: string }
  >();

  for (const inv of allInvoices) {
    const existing = customers.get(inv.customer_id) || {
      name: inv.customer_name,
      total: 0,
      count: 0,
      symbol: inv.currency_symbol || "$",
    };
    existing.total += inv.total || 0;
    existing.count++;
    customers.set(inv.customer_id, existing);
  }

  const sorted = [...customers.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  const grandTotal = sorted.reduce((s, c) => s + c.total, 0);
  const sym = sorted[0]?.symbol || "$";

  const periodLabel = year
    ? year
    : args.from && args.to
      ? `${args.from} to ${args.to}`
      : "all time";

  console.log(`🏆 Top ${sorted.length} Customers by Revenue (${periodLabel})`);
  console.log("=".repeat(55));
  console.log(`Total: ${currency(grandTotal, sym)} from ${allInvoices.length} invoice(s)\n`);

  const maxTotal = sorted[0]?.total || 1;

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    const pct = grandTotal > 0 ? ((c.total / grandTotal) * 100).toFixed(1) : "0";
    const barLen = Math.round((c.total / maxTotal) * 15);
    const bar = "█".repeat(barLen);
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;

    console.log(`  ${medal} ${c.name}`);
    console.log(`     ${bar} ${currency(c.total, c.symbol)} (${pct}%) - ${c.count} invoices`);
    console.log();
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
