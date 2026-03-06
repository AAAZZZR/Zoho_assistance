/**
 * recurring.ts - Query Zoho Invoice recurring invoices
 *
 * Usage:
 *   npx tsx recurring.ts                  # List all
 *   npx tsx recurring.ts --id 12345       # Get detail
 */

import { zohoGet, currency, statusIcon, parseArgs } from "./auth";

async function getRecurringDetail(id: string) {
  const data = await zohoGet(`recurringinvoices/${id}`);
  const r = data.recurring_invoice;
  const sym = r.currency_symbol || "$";

  console.log(`🔄 Recurring Invoice: ${r.recurrence_name}`);
  console.log(`   Customer:     ${r.customer_name}`);
  console.log(`   Status:       ${statusIcon(r.status)} ${r.status}`);
  console.log(`   Total:        ${currency(r.total || 0, sym)}`);
  console.log(`   Frequency:    Every ${r.repeat_every} ${r.recurrence_frequency}`);
  console.log(`   Start:        ${r.start_date}`);
  console.log(`   End:          ${r.end_date || "Never"}`);
  console.log(`   Next Invoice: ${r.next_invoice_date || "-"}`);
  console.log(`   Last Sent:    ${r.last_sent_date || "-"}`);

  if (r.line_items?.length) {
    console.log(`\n   Line Items:`);
    for (const item of r.line_items) {
      console.log(`   - ${item.name} × ${item.quantity} @ ${currency(item.rate, sym)} = ${currency(item.item_total, sym)}`);
    }
  }
}

async function listRecurring() {
  const data = await zohoGet("recurringinvoices");
  const items = data.recurring_invoices || [];

  if (!items.length) {
    console.log("No recurring invoices found.");
    return;
  }

  console.log(`🔄 ${items.length} recurring invoice(s)\n`);

  for (const r of items) {
    console.log(`  ${statusIcon(r.status)} ${r.recurrence_name} - ${r.customer_name}`);
    console.log(`     Total: ${currency(r.total || 0)} | Every ${r.repeat_every} ${r.recurrence_frequency} | Status: ${r.status}`);
    console.log(`     Next: ${r.next_invoice_date || "-"}`);
    console.log();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.id) {
    await getRecurringDetail(args.id);
  } else {
    await listRecurring();
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
