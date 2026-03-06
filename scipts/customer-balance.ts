/**
 * customer-balance.ts - Outstanding balance per customer
 *
 * Usage:
 *   npx tsx customer-balance.ts                  # All customers with balance
 *   npx tsx customer-balance.ts --sort desc      # Sort by highest balance
 *   npx tsx customer-balance.ts --search "王"    # Filter by name
 *   npx tsx customer-balance.ts --zero           # Include zero-balance customers
 */

import { zohoGet, currency, parseArgs } from "./auth";

async function main() {
  const args = parseArgs(process.argv);

  const data = await zohoGet("contacts");
  let contacts = data.contacts || [];

  // Filter by search
  if (args.search) {
    const q = args.search.toLowerCase();
    contacts = contacts.filter(
      (c: any) =>
        (c.contact_name || "").toLowerCase().includes(q) ||
        (c.company_name || "").toLowerCase().includes(q)
    );
  }

  // Build balance info
  const balances = contacts
    .map((c: any) => ({
      id: c.contact_id,
      name: c.contact_name,
      company: c.company_name || "-",
      outstanding: c.outstanding_receivable_amount || 0,
      credits: c.unused_credits_receivable_amount || 0,
      symbol: c.currency_symbol || "$",
    }))
    .filter((c: any) => args.zero === "true" || c.outstanding > 0);

  // Sort
  if (args.sort === "asc") {
    balances.sort((a: any, b: any) => a.outstanding - b.outstanding);
  } else {
    balances.sort((a: any, b: any) => b.outstanding - a.outstanding);
  }

  if (!balances.length) {
    console.log("No customers with outstanding balance found.");
    return;
  }

  const totalOutstanding = balances.reduce((s: number, c: any) => s + c.outstanding, 0);
  const sym = balances[0]?.symbol || "$";

  console.log(`👥 Customer Balances`);
  console.log("=".repeat(50));
  console.log(`Total Outstanding: ${currency(totalOutstanding, sym)} across ${balances.length} customer(s)\n`);

  for (const c of balances) {
    const pct =
      totalOutstanding > 0 ? ((c.outstanding / totalOutstanding) * 100).toFixed(1) : "0";
    console.log(`  • ${c.name} (${c.company})`);
    console.log(`    Outstanding: ${currency(c.outstanding, c.symbol)} (${pct}%)`);
    if (c.credits > 0) {
      console.log(`    Credits: ${currency(c.credits, c.symbol)}`);
    }
    console.log();
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
