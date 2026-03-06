# OpenClaw Zoho Invoice Skill

Query and manage Zoho Invoice data through the OpenClaw Telegram bot.

## Architecture

```
Telegram User → OpenClaw Bot → EverySolar Web App (token) → Zoho Invoice API
```

## File Structure

```
openclaw-zoho-skill/
├── SKILL.md                          # Main skill definition for OpenClaw
├── README.md                         # This file
└── scripts/
    ├── auth.ts                       # Shared auth & HTTP utilities
    │
    ├── contacts.ts                   # List/search/get contacts
    ├── invoices.ts                   # List/filter/get invoices
    ├── items.ts                      # List/search products & services
    ├── payments.ts                   # List/get payment records
    ├── estimates.ts                  # List/filter quotes
    ├── expenses.ts                   # List/filter expenses
    ├── credit-notes.ts              # List credit notes
    ├── recurring.ts                  # List recurring invoices
    │
    ├── create-invoice.ts            # Create a new invoice
    ├── send-invoice.ts              # Email an invoice to customer
    ├── record-payment.ts            # Record a payment
    │
    ├── dashboard.ts                  # Account overview & summary
    ├── aging-report.ts              # AR aging breakdown
    ├── revenue-report.ts            # Revenue by month/quarter
    ├── customer-balance.ts          # Outstanding per customer
    └── top-customers.ts             # Rank customers by revenue
```

## Prerequisites

- Node.js 18+ (for native `fetch`)
- `tsx` or `ts-node` to run TypeScript: `npm install -g tsx`

## Quick Start

```bash
# Overview dashboard
npx tsx scripts/dashboard.ts

# Query contacts
npx tsx scripts/contacts.ts --search "Solar"

# Unpaid invoices
npx tsx scripts/invoices.ts --status unpaid

# Overdue invoices
npx tsx scripts/invoices.ts --overdue

# Aging report
npx tsx scripts/aging-report.ts

# Revenue report
npx tsx scripts/revenue-report.ts --year 2024

# Top customers
npx tsx scripts/top-customers.ts --limit 10

# Create and send invoice
npx tsx scripts/create-invoice.ts --customer CUST_ID --items '[{"item_id":"xxx","quantity":1,"rate":5000}]'
npx tsx scripts/send-invoice.ts --id INV_ID

# Record payment
npx tsx scripts/record-payment.ts --invoice INV_ID --amount 5000
```

## User Intent → Script Mapping

| User says | Script to run |
|-----------|--------------|
| "How's the business" / "summary" | `dashboard.ts` |
| "Any unpaid invoices?" | `invoices.ts --status unpaid` |
| "What's overdue?" | `invoices.ts --overdue` |
| "Look up customer X" | `contacts.ts --search "X"` |
| "How much does X owe?" | `customer-balance.ts --search "X"` |
| "Top clients" | `top-customers.ts` |
| "Aging report" | `aging-report.ts` |
| "Revenue this year?" | `revenue-report.ts` |
| "Create invoice for X" | `create-invoice.ts --customer X --items [...]` |
| "Send invoice XXX" | `send-invoice.ts --id XXX` |
| "Record payment" | `record-payment.ts --invoice XXX --amount N` |
| "All products" | `items.ts` |
| "Recent payments" | `payments.ts` |
| "Pending quotes" | `estimates.ts --status sent` |
| "Expenses this month" | `expenses.ts --from YYYY-MM-01 --to YYYY-MM-DD` |
| "Recurring invoices" | `recurring.ts` |
