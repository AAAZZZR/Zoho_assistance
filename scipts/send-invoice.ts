/**
 * send-invoice.ts - Email an invoice to the customer
 *
 * Usage:
 *   npx tsx send-invoice.ts --id 12345
 *   npx tsx send-invoice.ts --id 12345 --to "customer@email.com" --subject "Your Invoice" --body "Please find attached..."
 */

import { zohoPost, zohoGet, parseArgs } from "./auth";

async function main() {
  const args = parseArgs(process.argv);

  if (!args.id) {
    console.log("Usage: npx tsx send-invoice.ts --id INVOICE_ID");
    console.log("Optional: --to EMAIL --subject TEXT --body TEXT");
    process.exit(0);
  }

  // First, get invoice details to confirm
  const detail = await zohoGet(`invoices/${args.id}`);
  const inv = detail.invoice;

  console.log(`📤 Sending invoice ${inv.invoice_number} to ${inv.customer_name}...`);

  const emailData: Record<string, any> = {};
  if (args.to) emailData.to_mail_ids = [{ mail_id: args.to }];
  if (args.subject) emailData.subject = args.subject;
  if (args.body) emailData.body = args.body;

  await zohoPost(`invoices/${args.id}/email`, emailData);

  console.log(`✅ Invoice ${inv.invoice_number} sent successfully!`);
  console.log(`   To: ${args.to || inv.email || "default contact email"}`);
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
