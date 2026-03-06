/**
 * expenses.ts - Query Zoho Invoice expenses
 *
 * Usage:
 *   npx tsx expenses.ts                              # List all
 *   npx tsx expenses.ts --from 2024-01-01 --to 2024-12-31
 *   npx tsx expenses.ts --id 12345                   # Get detail
 */

import { zohoGet, currency, parseArgs } from "./auth";

async function getExpenseDetail(id: string) {
  const data = await zohoGet(`expenses/${id}`);
  const e = data.expense;

  console.log(`💸 Expense ${e.expense_id}`);
  console.log(`   Category:    ${e.category_name || "-"}`);
  console.log(`   Amount:      ${currency(e.total || 0, e.currency_symbol)}`);
  console.log(`   Date:        ${e.date}`);
  console.log(`   Vendor:      ${e.vendor_name || "-"}`);
  console.log(`   Customer:    ${e.customer_name || "-"}`);
  console.log(`   Description: ${e.description || "-"}`);
  console.log(`   Billable:    ${e.is_billable ? "Yes" : "No"}`);
  console.log(`   Status:      ${e.status || "-"}`);
}

async function listExpenses(args: Record<string, string>) {
  const params: Record<string, string> = {};
  if (args.from) params.date_start = args.from;
  if (args.to) params.date_end = args.to;

  const data = await zohoGet("expenses", params);
  const expenses = data.expenses || [];

  if (!expenses.length) {
    console.log("No expenses found.");
    return;
  }

  const total = expenses.reduce((s: number, e: any) => s + (e.total || 0), 0);
  console.log(`💸 ${expenses.length} expense(s) | Total: ${currency(total)}\n`);

  for (const e of expenses) {
    console.log(`  • ${e.category_name || e.description || "Expense"}`);
    console.log(`    Amount: ${currency(e.total || 0)} | Date: ${e.date} | Vendor: ${e.vendor_name || "-"}`);
    console.log();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.id) {
    await getExpenseDetail(args.id);
  } else {
    await listExpenses(args);
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
