/**
 * create-invoice.ts - Create a new invoice in Zoho
 *
 * Usage:
 *   npx tsx create-invoice.ts --customer 12345 --items '[{"item_id":"xxx","quantity":1,"rate":1000}]'
 *   npx tsx create-invoice.ts --customer 12345 --items '[...]' --date 2024-03-01 --due 2024-04-01 --notes "Thank you"
 *   npx tsx create-invoice.ts --json '{ full invoice JSON }'
 */

import { zohoPost, currency, parseArgs } from "./auth";

async function main() {
  const args = parseArgs(process.argv);

  let invoiceData: Record<string, any>;

  if (args.json) {
    // Full JSON mode
    try {
      invoiceData = JSON.parse(args.json);
    } catch {
      console.error("❌ Invalid JSON format");
      process.exit(1);
    }
  } else if (args.customer && args.items) {
    // Structured mode
    let lineItems;
    try {
      lineItems = JSON.parse(args.items);
    } catch {
      console.error("❌ Invalid items JSON. Expected: [{\"item_id\":\"xxx\",\"quantity\":1,\"rate\":1000}]");
      process.exit(1);
    }

    invoiceData = {
      customer_id: args.customer,
      line_items: lineItems,
    };

    if (args.date) invoiceData.date = args.date;
    if (args.due) invoiceData.due_date = args.due;
    if (args.notes) invoiceData.notes = args.notes;
    if (args.terms) invoiceData.terms = args.terms;
    if (args.number) invoiceData.invoice_number = args.number;
    if (args.discount) invoiceData.discount = parseFloat(args.discount);
    if (args.reference) invoiceData.reference_number = args.reference;
  } else {
    console.log("Usage:");
    console.log("  npx tsx create-invoice.ts --customer CUSTOMER_ID --items '[{\"item_id\":\"xxx\",\"quantity\":1,\"rate\":1000}]'");
    console.log("  npx tsx create-invoice.ts --json '{...full invoice JSON...}'");
    console.log("\nOptional flags: --date, --due, --notes, --terms, --number, --discount, --reference");
    process.exit(0);
  }

  const result = await zohoPost("invoices", invoiceData);
  const inv = result.invoice;

  console.log(`✅ Invoice created successfully!`);
  console.log(`   Number:   ${inv.invoice_number}`);
  console.log(`   Customer: ${inv.customer_name}`);
  console.log(`   Total:    ${currency(inv.total || 0, inv.currency_symbol)}`);
  console.log(`   ID:       ${inv.invoice_id}`);
  console.log(`   Status:   ${inv.status}`);
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
