/**
 * credit-notes.ts - Query Zoho Invoice credit notes
 *
 * Usage:
 *   npx tsx credit-notes.ts               # List all
 *   npx tsx credit-notes.ts --id 12345    # Get detail
 */

import { zohoGet, currency, statusIcon, parseArgs } from "./auth";

async function getCreditNoteDetail(id: string) {
  const data = await zohoGet(`creditnotes/${id}`);
  const cn = data.creditnote;
  const sym = cn.currency_symbol || "$";

  console.log(`📝 Credit Note ${cn.creditnote_number}`);
  console.log(`   Customer:   ${cn.customer_name}`);
  console.log(`   Status:     ${statusIcon(cn.status)} ${cn.status}`);
  console.log(`   Date:       ${cn.date}`);
  console.log(`   Total:      ${currency(cn.total || 0, sym)}`);
  console.log(`   Balance:    ${currency(cn.balance || 0, sym)}`);

  if (cn.line_items?.length) {
    console.log(`\n   Line Items:`);
    for (const item of cn.line_items) {
      console.log(`   - ${item.name} × ${item.quantity} @ ${currency(item.rate, sym)} = ${currency(item.item_total, sym)}`);
    }
  }
}

async function listCreditNotes() {
  const data = await zohoGet("creditnotes");
  const notes = data.creditnotes || [];

  if (!notes.length) {
    console.log("No credit notes found.");
    return;
  }

  const total = notes.reduce((s: number, n: any) => s + (n.total || 0), 0);
  console.log(`📝 ${notes.length} credit note(s) | Total: ${currency(total)}\n`);

  for (const n of notes) {
    console.log(`  ${statusIcon(n.status)} ${n.creditnote_number} - ${n.customer_name}`);
    console.log(`     Total: ${currency(n.total || 0)} | Balance: ${currency(n.balance || 0)} | Status: ${n.status}`);
    console.log();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.id) {
    await getCreditNoteDetail(args.id);
  } else {
    await listCreditNotes();
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
