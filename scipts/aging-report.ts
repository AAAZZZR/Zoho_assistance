/**
 * aging-report.ts - Accounts receivable aging breakdown
 *
 * Groups unpaid invoices into aging buckets:
 *   Current (not yet due), 1-30 days, 31-60, 61-90, 90+ days overdue
 *
 * Usage:
 *   npx tsx aging-report.ts
 */

import { zohoGet, currency } from "./auth";

interface AgingBucket {
  label: string;
  invoices: any[];
  total: number;
}

async function main() {
  const data = await zohoGet("invoices", { status: "unpaid" });
  const unpaid = data.invoices || [];

  // Also include overdue (some APIs separate them)
  const overdueData = await zohoGet("invoices", { status: "overdue" });
  const overdue = overdueData.invoices || [];

  // Merge and deduplicate
  const allInvoices = new Map<string, any>();
  for (const inv of [...unpaid, ...overdue]) {
    allInvoices.set(inv.invoice_id, inv);
  }

  const invoices = [...allInvoices.values()];
  const now = Date.now();

  const buckets: AgingBucket[] = [
    { label: "Current (not yet due)", invoices: [], total: 0 },
    { label: "1-30 days overdue", invoices: [], total: 0 },
    { label: "31-60 days overdue", invoices: [], total: 0 },
    { label: "61-90 days overdue", invoices: [], total: 0 },
    { label: "90+ days overdue", invoices: [], total: 0 },
  ];

  for (const inv of invoices) {
    const dueDate = new Date(inv.due_date).getTime();
    const daysOverdue = Math.floor((now - dueDate) / 86400000);
    const balance = inv.balance || 0;

    let bucket: AgingBucket;
    if (daysOverdue <= 0) bucket = buckets[0];
    else if (daysOverdue <= 30) bucket = buckets[1];
    else if (daysOverdue <= 60) bucket = buckets[2];
    else if (daysOverdue <= 90) bucket = buckets[3];
    else bucket = buckets[4];

    bucket.invoices.push({ ...inv, daysOverdue });
    bucket.total += balance;
  }

  const sym = invoices[0]?.currency_symbol || "$";
  const grandTotal = invoices.reduce((s: number, i: any) => s + (i.balance || 0), 0);

  console.log("📊 Accounts Receivable Aging Report");
  console.log("=".repeat(50));
  console.log(`Total Outstanding: ${currency(grandTotal, sym)} across ${invoices.length} invoice(s)\n`);

  for (const bucket of buckets) {
    if (bucket.invoices.length === 0) {
      console.log(`${bucket.label}: -- none --\n`);
      continue;
    }

    const pct = grandTotal > 0 ? ((bucket.total / grandTotal) * 100).toFixed(1) : "0";
    console.log(`${bucket.label}: ${currency(bucket.total, sym)} (${pct}%) - ${bucket.invoices.length} invoice(s)`);

    for (const inv of bucket.invoices) {
      const overdueTxt =
        inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : "current";
      console.log(
        `  • ${inv.invoice_number} - ${inv.customer_name} - ${currency(inv.balance, sym)} (${overdueTxt})`
      );
    }
    console.log();
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
