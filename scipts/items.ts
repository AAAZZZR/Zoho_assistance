/**
 * items.ts - Query Zoho Invoice items (products/services)
 *
 * Usage:
 *   npx tsx items.ts                     # List all items
 *   npx tsx items.ts --search "solar"    # Search by name
 *   npx tsx items.ts --id 12345          # Get item detail
 */

import { zohoGet, currency, parseArgs } from "./auth";

async function getItemDetail(id: string) {
  const data = await zohoGet(`items/${id}`);
  const item = data.item;

  console.log(`📦 ${item.name}`);
  console.log(`   SKU:          ${item.sku || "-"}`);
  console.log(`   Rate:         ${currency(item.rate || 0)}`);
  console.log(`   Description:  ${item.description || "-"}`);
  console.log(`   Unit:         ${item.unit || "-"}`);
  console.log(`   Tax:          ${item.tax_name || "none"} (${item.tax_percentage || 0}%)`);
  console.log(`   Product Type: ${item.product_type || "-"}`);
  console.log(`   Status:       ${item.status || "-"}`);
}

async function listItems(search?: string) {
  const params: Record<string, string> = {};
  if (search) params.name_contains = search;

  const data = await zohoGet("items", params);
  const items = data.items || [];

  if (!items.length) {
    console.log("No items found.");
    return;
  }

  console.log(`📦 ${items.length} item(s)\n`);
  for (const item of items) {
    console.log(`  • ${item.name}`);
    console.log(`    ID: ${item.item_id} | Rate: ${currency(item.rate || 0)} | SKU: ${item.sku || "-"} | Status: ${item.status || "-"}`);
    console.log();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.id) {
    await getItemDetail(args.id);
  } else {
    await listItems(args.search);
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
