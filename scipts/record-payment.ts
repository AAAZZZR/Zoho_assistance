/**
 * record-payment.ts - Record a payment against an invoice
 *
 * Usage:
 *   npx tsx record-payment.ts --invoice 12345 --amount 5000
 *   npx tsx record-payment.ts --invoice 12345 --amount 5000 --date 2024-03-01 --mode "Bank Transfer" --reference "TXN-001"
 */

import { zohoPost, zohoGet, currency, parseArgs } from "./auth";

async function main() {
  const args = parseArgs(process.argv);

  if (!args.invoice || !args.amount) {
    console.log("Usage: npx tsx record-payment.ts --invoice INVOICE_ID --amount AMOUNT");
    console.log("Optional: --date YYYY-MM-DD --mode 'Bank Transfer' --reference 'REF-001' --account ACCOUNT_ID");
    process.exit(0);
  }

  // Fetch invoice to get customer_id and confirm
  const detail = await zohoGet(`invoices/${args.invoice}`);
  const inv = detail.invoice;
  const amount = parseFloat(args.amount);

  console.log(`💰 Recording payment of ${currency(amount, inv.currency_symbol)} for invoice ${inv.invoice_number}...`);

  const paymentData: Record<string, any> = {
    customer_id: inv.customer_id,
    amount,
    invoices: [
      {
        invoice_id: args.invoice,
        amount_applied: amount,
      },
    ],
  };

  if (args.date) paymentData.date = args.date;
  if (args.mode) paymentData.payment_mode = args.mode;
  if (args.reference) paymentData.reference_number = args.reference;
  if (args.account) paymentData.account_id = args.account;

  const result = await zohoPost("customerpayments", paymentData);
  const p = result.payment;

  console.log(`✅ Payment recorded!`);
  console.log(`   Payment #: ${p.payment_number}`);
  console.log(`   Amount:    ${currency(p.amount || 0, inv.currency_symbol)}`);
  console.log(`   Invoice:   ${inv.invoice_number}`);
  console.log(`   Customer:  ${inv.customer_name}`);
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
