---
name: zoho-invoice
description: Query and manage Zoho Invoice data including contacts, invoices, items, payments, estimates, expenses, credit notes, recurring invoices, and dashboards. Use this skill whenever the user asks about billing, invoices, customers, outstanding payments, revenue, overdue accounts, financial summaries, or anything related to their Zoho Invoice account.
---

# Zoho Invoice Skill

Fetch and manage data from Zoho Invoice via the EverySolar web app token endpoint.

## Architecture

```
Telegram User → OpenClaw Bot → EverySolar Web App (get token) → Zoho Invoice API
```

## Configuration

- **Web App URL**: `env:WEBAPP_URL`
- **Token Endpoint**: `GET /api/internal/tokens`
- **Auth Header**: `X-Internal-Key: env:INTERNAL_KEY`
- **Zoho Organization ID**: `env:ORG_ID`
- **Zoho Invoice API Base**: `env:ZOHO_BASE` (default: `https://www.zohoapis.com/invoice/v3`)

## Token Flow

1. Call the web app token endpoint with `X-Internal-Key` header
2. Response: `{ "zoho": { "accessToken": "..." }, "google": { "accessToken": "..." } }`
3. If `zoho` is `null`, the user hasn't connected Zoho yet — prompt them to visit the web app
4. Use the access token as `Authorization: Zoho-oauthtoken {token}`
5. Token expires in ~1 hour. If you get a 401, re-fetch the token.

## Available Scripts

All scripts are in the `scripts/` directory. Run with `npx ts-node scripts/<file>.ts` or `npx tsx scripts/<file>.ts`.

Each script auto-fetches the token, so you just need to pass the right arguments.

### Core Utilities

| Script | Purpose |
|--------|---------|
| `auth.ts` | Shared auth & HTTP client (imported by other scripts) |

### Query Scripts

| Script | Purpose | Example |
|--------|---------|---------|
| `contacts.ts` | List, search, or get contact details | `--search "王"` or `--id xxx` |
| `invoices.ts` | List, filter, or get invoice details | `--status unpaid` `--overdue` `--customer xxx` |
| `items.ts` | List or search products/services | `--search "solar"` |
| `payments.ts` | List or get payment records | `--id xxx` |
| `estimates.ts` | List or filter quotes/estimates | `--status sent` |
| `expenses.ts` | List or filter expenses | `--from 2024-01-01 --to 2024-12-31` |
| `credit-notes.ts` | List credit notes | (no args needed) |
| `recurring.ts` | List recurring invoices | (no args needed) |

### Action Scripts

| Script | Purpose | Example |
|--------|---------|---------|
| `create-invoice.ts` | Create a new invoice | `--customer xxx --items '[...]'` |
| `send-invoice.ts` | Send/email an invoice to customer | `--id xxx` |
| `record-payment.ts` | Record a payment against an invoice | `--invoice xxx --amount 1000` |

### Analytics & Reporting

| Script | Purpose | Example |
|--------|---------|---------|
| `dashboard.ts` | Overview: unpaid, overdue, recent activity | (no args) |
| `aging-report.ts` | Accounts receivable aging breakdown | (no args) |
| `revenue-report.ts` | Revenue summary by period | `--period monthly --year 2024` |
| `customer-balance.ts` | Outstanding balance per customer | `--sort desc` |
| `top-customers.ts` | Top customers by revenue | `--limit 10` |

## Error Handling

| Code | Reason | Action |
|------|--------|--------|
| 401 | Token expired | Re-fetch from `/api/internal/tokens` |
| 403 | Wrong internal key | Check `X-Internal-Key` value |
| 404 | Resource not found | Verify the ID |
| 429 | Rate limited | Wait and retry |
| `zoho: null` | Zoho not connected | Ask user to connect at web app |

## Response Formatting

When presenting data to the user in Telegram, format it cleanly:

- Use emoji status indicators: ✅ paid, 🟡 unpaid, 🔴 overdue, 📝 draft
- Show currency with proper formatting (e.g., NT$ 15,000)
- For lists, show the most important info first (number, customer, amount, status)
- For summaries, lead with the headline number then break down details
- Always mention the count of results and totals where applicable

## Pagination

Zoho Invoice API defaults to 200 items per page. Use `page` and `per_page` params for larger datasets. Most scripts handle this automatically.

## Common User Intents → Script Mapping

| User says | Run |
|-----------|-----|
| "Show me a summary" / "How's the business" | `dashboard.ts` |
| "Any unpaid invoices?" | `invoices.ts --status unpaid` |
| "What's overdue?" | `invoices.ts --overdue` |
| "Look up customer X" | `contacts.ts --search "X"` |
| "How much does X owe us?" | `customer-balance.ts --search "X"` |
| "Who are our biggest clients?" | `top-customers.ts` |
| "Show aging report" | `aging-report.ts` |
| "Revenue this month/year?" | `revenue-report.ts --period monthly` |
| "Create invoice for X" | `create-invoice.ts --customer X --items [...]` |
| "Send invoice XXX" | `send-invoice.ts --id XXX` |
| "Record payment for invoice XXX" | `record-payment.ts --invoice XXX --amount N` |
| "List all products" | `items.ts` |
| "Recent payments" | `payments.ts` |
| "Any quotes pending?" | `estimates.ts --status sent` |
| "Show expenses this month" | `expenses.ts --from YYYY-MM-01 --to YYYY-MM-DD` |
| "Recurring invoices" | `recurring.ts` |
