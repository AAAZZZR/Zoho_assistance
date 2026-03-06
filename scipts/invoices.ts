/**
 * invoices.ts - Query Zoho Invoice invoices
 *
 * Usage:
 *   npx tsx invoices.ts                          # List all
 *   npx tsx invoices.ts --status unpaid           # Filter by status
 *   npx tsx invoices.ts --overdue                 # Shortcut for overdue
 *   npx tsx invoices.ts --customer 12345          # Filter by customer
 *   npx tsx invoices.ts --from 2024-01-01 --to 2024-12-31
 *   npx tsx invoices.ts --id 12345                # Single invoice detail
 *   npx tsx invoices.ts --search "INV-001"        # Search by number
 */

import { zohoGet, currency, statusIcon, parseArgs } from "./auth";

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  customer_id: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  currency_symbol: string;
  currency_code: string;
}

async function getInvoiceDetail(id: string) {
  const data = await zohoGet(`invoices/${id}`);
  const inv = data.invoice;
  const sym = inv.currency_symbol || "$";

  console.log(`📄 Invoice ${inv.invoice_number}`);
  console.log(`   Customer:   ${inv.customer_name}`);
  console.log(`   Status:     ${statusIcon(inv.status)} ${inv.status}`);
  console.log(`   Date:       ${inv.date}`);
  console.log(`   Due:        ${inv.due_date}`);
  console.log(`   Subtotal:   ${currency(inv.sub_total || 0, sym)}`);
  console.log(`   Tax:        ${currency(inv.tax_total || 0, sym)}`);
  console.log(`   Total:      ${currency(inv.total || 0, sym)}`);
  console.log(`   Balance:    ${currency(inv.balance || 0, sym)}`);
  console.log(`   Payment:    ${currency(inv.payment_made || 0, sym)}`);

  if (inv.line_items?.length) {
    console.log(`\n   Line Items:`);
    for (const item of inv.line_items) {
      console.log(
        `   - ${item.name} × ${item.quantity} @ ${currency(item.rate, sym)} = ${currency(item.item_total, sym)}`
      );
      if (item.description) console.log(`     ${item.description}`);
    }
  }

  if (inv.notes) console.log(`\n   Notes: ${inv.notes}`);
  if (inv.terms) console.log(`   Terms: ${inv.terms}`);
}

async function listInvoices(args: Record<string, string>) {
  const params: Record<string, string> = {};

  if (args.status) params.status = args.status;
  if (args.overdue) params.status = "overdue";
  if (args.customer) params.customer_id = args.customer;
  if (args.from) params.date_start = args.from;
  if (args.to) params.date_end = args.to;
  if (args.search) params.invoice_number_contains = args.search;

  const data = await zohoGet("invoices", params);
  const invoices: Invoice[] = data.invoices || [];

  if (!invoices.length) {
    console.log("No invoices found.");
    return;
  }

  const totalAmount = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalBalance = invoices.reduce((s, i) => s + (i.balance || 0), 0);
  const sym = invoices[0]?.currency_symbol || "$";

  console.log(
    `📄 ${invoices.length} invoice(s) | Total: ${currency(totalAmount, sym)} | Outstanding: ${currency(totalBalance, sym)}\n`
  );

  for (const inv of invoices) {
    console.log(
      `  ${statusIcon(inv.status)} ${inv.invoice_number} - ${inv.customer_name}`
    );
    console.log(
      `     Amount: ${currency(inv.total, sym)} | Balance: ${currency(inv.balance, sym)} | Status: ${inv.status}`
    );
    console.log(`     Date: ${inv.date} | Due: ${inv.due_date}`);
    console.log();
  }
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.id) {
    await getInvoiceDetail(args.id);
  } else {
    await listInvoices(args);
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
