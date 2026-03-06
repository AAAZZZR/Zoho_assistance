/**
 * dashboard.ts - Quick overview of the Zoho Invoice account
 *
 * Shows unpaid invoices, overdue invoices, recent payments, draft counts, etc.
 *
 * Usage:
 *   npx tsx dashboard.ts
 */

import { zohoGet, currency } from "./auth";

async function main() {
  console.log("📊 Zoho Invoice Dashboard\n" + "=".repeat(45));

  // Fetch in parallel for speed
  const [unpaidRes, overdueRes, draftRes, paidRes, contactsRes, paymentsRes] =
    await Promise.all([
      zohoGet("invoices", { status: "unpaid" }),
      zohoGet("invoices", { status: "overdue" }),
      zohoGet("invoices", { status: "draft" }),
      zohoGet("invoices", { status: "paid" }),
      zohoGet("contacts"),
      zohoGet("customerpayments"),
    ]);

  const unpaid = unpaidRes.invoices || [];
  const overdue = overdueRes.invoices || [];
  const drafts = draftRes.invoices || [];
  const paid = paidRes.invoices || [];
  const contacts = contactsRes.contacts || [];
  const payments = paymentsRes.customerpayments || paymentsRes.payments || [];

  const unpaidTotal = unpaid.reduce((s: number, i: any) => s + (i.balance || 0), 0);
  const overdueTotal = overdue.reduce((s: number, i: any) => s + (i.balance || 0), 0);
  const paidTotal = paid.reduce((s: number, i: any) => s + (i.total || 0), 0);
  const sym = unpaid[0]?.currency_symbol || paid[0]?.currency_symbol || "$";

  // Summary
  console.log(`\n🟡 Unpaid:     ${unpaid.length} invoices | ${currency(unpaidTotal, sym)}`);
  console.log(`🔴 Overdue:    ${overdue.length} invoices | ${currency(overdueTotal, sym)}`);
  console.log(`📝 Drafts:     ${drafts.length} invoices`);
  console.log(`✅ Paid:       ${paid.length} invoices | ${currency(paidTotal, sym)}`);
  console.log(`👤 Contacts:   ${contacts.length}`);
  console.log(`💰 Payments:   ${payments.length} records`);

  // Overdue details
  if (overdue.length > 0) {
    console.log(`\n⚠️  Overdue Invoices:`);
    for (const inv of overdue.slice(0, 10)) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(inv.due_date).getTime()) / 86400000
      );
      console.log(
        `  🔴 ${inv.invoice_number} - ${inv.customer_name} - ${currency(inv.balance, sym)} (${daysOverdue} days overdue)`
      );
    }
    if (overdue.length > 10) {
      console.log(`  ... and ${overdue.length - 10} more`);
    }
  }

  // Recent payments (last 5)
  if (payments.length > 0) {
    console.log(`\n💰 Recent Payments:`);
    const recent = payments.slice(0, 5);
    for (const p of recent) {
      console.log(
        `  ✅ ${p.payment_number || "-"} - ${p.customer_name} - ${currency(p.amount || 0, sym)} (${p.date})`
      );
    }
  }

  // Top outstanding customers
  const customerBalances = new Map<string, { name: string; balance: number }>();
  for (const inv of unpaid) {
    const existing = customerBalances.get(inv.customer_id) || {
      name: inv.customer_name,
      balance: 0,
    };
    existing.balance += inv.balance || 0;
    customerBalances.set(inv.customer_id, existing);
  }

  if (customerBalances.size > 0) {
    const sorted = [...customerBalances.values()].sort(
      (a, b) => b.balance - a.balance
    );
    console.log(`\n👥 Top Outstanding Customers:`);
    for (const c of sorted.slice(0, 5)) {
      console.log(`  • ${c.name}: ${currency(c.balance, sym)}`);
    }
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
