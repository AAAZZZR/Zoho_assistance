/**
 * estimates.ts - Query Zoho Invoice estimates (quotes)
 *
 * Usage:
 *   npx tsx estimates.ts                     # List all
 *   npx tsx estimates.ts --status sent        # Filter by status
 *   npx tsx estimates.ts --id 12345           # Get detail
 */

import { zohoGet, currency, statusIcon, parseArgs } from "./auth";

async function getEstimateDetail(id: string) {
  const data = await zohoGet(`estimates/${id}`);
  const e = data.estimate;
  const sym = e.currency_symbol || "$";

  console.log(`📋 Estimate ${e.estimate_number}`);
  console.log(`   Customer:  ${e.customer_name}`);
  console.log(`   Status:    ${statusIcon(e.status)} ${e.status}`);
  console.log(`   Date:      ${e.date}`);
  console.log(`   Expiry:    ${e.expiry_date || "-"}`);
  console.log(`   Total:     ${currency(e.total || 0, sym)}`);

  if (e.line_items?.length) {
    console.log(`\n   Line Items:`);
    for (const item of e.line_items) {
      console.log(`   - ${item.name} × ${item.quantity} @ ${currency(item.rate, sym)} = ${currency(item.item_total, sym)}`);
    }
  }
}

async function listEstimates(args: Record<string, string>) {
  const params: Record<string, string> = {};
  if (args.status) params.status = args.status;

  const data = await zohoGet("estimates", params);
  const estimates = data.estimates || [];

  if (!estimates.length) {
    console.log("No estimates found.");
    return;
  }

  const total = estimates.reduce((s: number, e: any) => s + (e.total || 0), 0);
  console.log(`📋 ${estimates.length} estimate(s) | Total value: ${currency(total)}\n`);

  for (const e of estimates) {
    console.log(`  ${statusIcon(e.status)} ${e.estimate_number} - ${e.customer_name}`);
    console.log(`     Total: ${currency(e.total || 0)} | Status: ${e.status} | Date: ${e.date}`);
    console.log();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.id) {
    await getEstimateDetail(args.id);
  } else {
    await listEstimates(args);
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
