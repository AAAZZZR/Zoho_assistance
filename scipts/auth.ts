/**
 * auth.ts - Shared authentication & HTTP utilities
 *
 * Handles:
 * - Fetching Zoho access token from the EverySolar web app
 * - Authenticated GET/POST requests to Zoho Invoice API
 * - Error handling and token refresh
 */

const WEBAPP_URL = process.env.WEBAPP_URL || "";
const INTERNAL_KEY = process.env.INTERNAL_KEY || "";
const ORG_ID = process.env.ORG_ID || "";
const ZOHO_BASE = process.env.ZOHO_BASE || "https://www.zohoapis.com/invoice/v3";

export { ORG_ID, ZOHO_BASE };

// ── Token ────────────────────────────────────────────────

interface TokenResponse {
  user: { id: string; email: string; name: string } | null;
  zoho: { accessToken: string } | null;
  google: { accessToken: string } | null;
}

let cachedToken: string | null = null;

export async function getToken(forceRefresh = false): Promise<string> {
  if (cachedToken && !forceRefresh) return cachedToken;

  const res = await fetch(`${WEBAPP_URL}/api/internal/tokens`, {
    headers: { "X-Internal-Key": INTERNAL_KEY },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch token: HTTP ${res.status}`);
  }

  const data: TokenResponse = await res.json();

  if (!data.zoho?.accessToken) {
    throw new Error(
      `Zoho not connected. Please visit ${WEBAPP_URL} to link your Zoho account.`
    );
  }

  cachedToken = data.zoho.accessToken;
  return cachedToken;
}

// ── HTTP helpers ─────────────────────────────────────────

export async function zohoGet<T = any>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const token = await getToken();
  params.organization_id = ORG_ID;

  const qs = new URLSearchParams(params).toString();
  const url = `${ZOHO_BASE}/${endpoint}?${qs}`;

  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });

  if (res.status === 401) {
    // Token expired — retry once with fresh token
    const freshToken = await getToken(true);
    const retry = await fetch(url.replace(token, freshToken), {
      headers: { Authorization: `Zoho-oauthtoken ${freshToken}` },
    });
    if (!retry.ok) throw new Error(`Zoho API error: ${retry.status}`);
    return retry.json();
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoho API error (${res.status}): ${body}`);
  }

  return res.json();
}

export async function zohoPost<T = any>(
  endpoint: string,
  body: Record<string, any>
): Promise<T> {
  const token = await getToken();
  const url = `${ZOHO_BASE}/${endpoint}?organization_id=${ORG_ID}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    const freshToken = await getToken(true);
    const retry = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${freshToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!retry.ok) throw new Error(`Zoho API error: ${retry.status}`);
    return retry.json();
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoho API error (${res.status}): ${text}`);
  }

  return res.json();
}

// ── Formatting helpers ───────────────────────────────────

export function currency(amount: number, symbol = "NT$"): string {
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function statusIcon(status: string): string {
  const icons: Record<string, string> = {
    paid: "✅",
    sent: "📤",
    draft: "📝",
    overdue: "🔴",
    unpaid: "🟡",
    partially_paid: "🟠",
    void: "⚫",
    accepted: "✅",
    declined: "❌",
    expired: "⏰",
    invoiced: "📄",
    active: "🟢",
    stopped: "🛑",
  };
  return icons[status] || "❓";
}

export function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith("--")) {
      const name = key.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[name] = val;
    }
  }
  return args;
}
