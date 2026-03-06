/**
 * payments.ts - Query Zoho Invoice payment records
 *
 * Usage:
 *   npx tsx payments.ts                  # List all payments
 *   npx tsx payments.ts --id 12345       # Get payment detail
 *   npx tsx payments.ts --from 2024-01-01 --to 2024-12-31
 */

import { zohoGet, currency, parseArgs } from "./auth";

async function getPaymentDetail(id: string) {
  const data = await zohoGet(`customerpayments/${id}`);
  const p = data.payment;

  console.log(`💰 Payment ${p.payment_number || p.payment_id}`);
  console.log(`   Customer:  ${p.customer_name}`);
  console.log(`   Amount:    ${currency(p.amount || 0, p.currency_symbol)}`);
  console.log(`   Date:      ${p.date}`);
  console.log(`   Mode:      ${p.payment_mode || "-"}`);
  console.log(`   Reference: ${p.reference_number || "-"}`);
  console.log(`   Account:   ${p.account_name || "-"}`);

  if (p.invoices?.length) {
    console.log(`\n   Applied to Invoices:`);
    for (const inv of p.invoices) {
      console.log(`   - ${inv.invoice_number}: ${currency(inv.amount_applied, p.currency_symbol)}`);
    }
  }
}

async function listPayments(args: Record<string, string>) {
  const params: Record<string, string> = {};
  if (args.from) params.date_start = args.from;
  if (args.to) params.date_end = args.to;

  const data = await zohoGet("customerpayments", params);
  const payments = data.customerpayments || data.payments || [];

  if (!payments.length) {
    console.log("No payments found.");
    return;
  }

  const total = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  console.log(`💰 ${payments.length} payment(s) | Total: ${currency(total)}\n`);

  for (const p of payments) {
    console.log(`  • ${p.payment_number || p.payment_id} - ${p.customer_name}`);
    console.log(`    Amount: ${currency(p.amount || 0)} | Date: ${p.date} | Mode: ${p.payment_mode || "-"}`);
    console.log();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.id) {
    await getPaymentDetail(args.id);
  } else {
    await listPayments(args);
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
