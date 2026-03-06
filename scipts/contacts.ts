/**
 * contacts.ts - Query Zoho Invoice contacts
 *
 * Usage:
 *   npx tsx contacts.ts                        # List all contacts
 *   npx tsx contacts.ts --search "王小明"       # Search by name
 *   npx tsx contacts.ts --id 12345             # Get single contact detail
 *   npx tsx contacts.ts --email "test@abc.com" # Search by email
 */

import { zohoGet, currency, parseArgs } from "./auth";

interface Contact {
  contact_id: string;
  contact_name: string;
  company_name: string;
  email: string;
  phone: string;
  currency_symbol: string;
  outstanding_receivable_amount: number;
  unused_credits_receivable_amount: number;
  status: string;
  contact_type: string;
  created_time: string;
}

async function getContactDetail(id: string) {
  const data = await zohoGet(`contacts/${id}`);
  const c = data.contact;

  console.log(`👤 ${c.contact_name}`);
  console.log(`   Company:      ${c.company_name || "-"}`);
  console.log(`   Email:        ${c.email || "-"}`);
  console.log(`   Phone:        ${c.phone || "-"}`);
  console.log(`   Type:         ${c.contact_type || "-"}`);
  console.log(`   Outstanding:  ${currency(c.outstanding_receivable_amount || 0, c.currency_symbol)}`);
  console.log(`   Credits:      ${currency(c.unused_credits_receivable_amount || 0, c.currency_symbol)}`);
  console.log(`   Status:       ${c.status}`);

  if (c.billing_address) {
    const a = c.billing_address;
    console.log(`   Address:      ${[a.address, a.city, a.state, a.zip, a.country].filter(Boolean).join(", ")}`);
  }

  if (c.contact_persons?.length) {
    console.log(`\n   Contact Persons:`);
    for (const p of c.contact_persons) {
      console.log(`   - ${p.first_name} ${p.last_name} <${p.email || "-"}> ${p.phone || ""}`);
    }
  }
}

async function listContacts(search?: string, email?: string) {
  const params: Record<string, string> = {};
  if (search) params.contact_name_contains = search;
  if (email) params.email_contains = email;

  const data = await zohoGet("contacts", params);
  const contacts: Contact[] = data.contacts || [];

  if (!contacts.length) {
    console.log("No contacts found.");
    return;
  }

  console.log(`📋 ${contacts.length} contact(s) found\n`);

  for (const c of contacts) {
    const outstanding = c.outstanding_receivable_amount || 0;
    const icon = outstanding > 0 ? "🔴" : "🟢";
    console.log(`  ${icon} ${c.contact_name} (${c.contact_type || "customer"})`);
    console.log(`     ID: ${c.contact_id}`);
    console.log(`     Company: ${c.company_name || "-"} | Email: ${c.email || "-"}`);
    if (outstanding > 0) {
      console.log(`     Outstanding: ${currency(outstanding, c.currency_symbol)}`);
    }
    console.log();
  }
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.id) {
    await getContactDetail(args.id);
  } else {
    await listContacts(args.search, args.email);
  }
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
