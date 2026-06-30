export type SupabaseConnectionStatus = {
  configured: boolean;
  url?: string;
  keyConfigured: boolean;
  keyType: "publishable" | "secret" | "jwt" | "unknown" | "missing";
  message?: string;
};

export type SupabaseTableStatus = {
  table: string;
  ok: boolean;
  status: number;
  count?: number | null;
  sampleKeys?: string[];
  message?: string;
};

type SupabaseSelectOptions = {
  select?: string;
  filters?: Record<string, string>;
  order?: string;
  limit?: number;
  offset?: number;
};

function cleanUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/\/+$/, "");
}

export function getSupabaseUrl(): string | undefined {
  return cleanUrl(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseKeyType(key = getSupabaseKey()): SupabaseConnectionStatus["keyType"] {
  if (!key) return "missing";
  if (key.startsWith("sb_publishable_")) return "publishable";
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.split(".").length === 3) return "jwt";
  return "unknown";
}

export function getSupabaseConnectionStatus(): SupabaseConnectionStatus {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  const keyType = getSupabaseKeyType(key);

  if (!url || !key) {
    return {
      configured: false,
      url,
      keyConfigured: Boolean(key),
      keyType,
      message: "Configure SUPABASE_URL e uma chave do Supabase no .env.local."
    };
  }

  return {
    configured: true,
    url,
    keyConfigured: true,
    keyType,
    message: keyType === "publishable"
      ? "Conectado com chave publicável. Serve para leitura/teste; para scripts de gravação, use secret/service_role."
      : "Configuração encontrada."
  };
}

function buildRestUrl(table: string, options: SupabaseSelectOptions = {}): string {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    throw new Error("SUPABASE_URL não configurado.");
  }

  const url = new URL(`${baseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", options.select ?? "*");

  for (const [key, value] of Object.entries(options.filters ?? {})) {
    url.searchParams.set(key, value);
  }

  if (options.order) {
    url.searchParams.set("order", options.order);
  }

  if (options.limit) {
    url.searchParams.set("limit", String(options.limit));
  }

  if (options.offset) {
    url.searchParams.set("offset", String(options.offset));
  }

  return url.toString();
}

export async function supabaseSelect<T>(table: string, options: SupabaseSelectOptions = {}): Promise<T[]> {
  const key = getSupabaseKey();

  if (!key) {
    throw new Error("Chave do Supabase não configurada.");
  }

  const response = await fetch(buildRestUrl(table, options), {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${table} respondeu ${response.status}: ${message}`);
  }

  return (await response.json()) as T[];
}


export async function supabaseSelectPaged<T>(
  table: string,
  options: Omit<SupabaseSelectOptions, "limit" | "offset"> = {},
  totalLimit = 2600,
  pageSize = 1000
): Promise<T[]> {
  const allRows: T[] = [];
  let offset = 0;

  while (allRows.length < totalLimit) {
    const remaining = totalLimit - allRows.length;
    const currentLimit = Math.min(pageSize, remaining);
    const rows = await supabaseSelect<T>(table, {
      ...options,
      limit: currentLimit,
      offset
    });

    allRows.push(...rows);

    if (rows.length < currentLimit) {
      break;
    }

    offset += currentLimit;
  }

  return allRows;
}

export async function checkSupabaseTable(table: string): Promise<SupabaseTableStatus> {
  const key = getSupabaseKey();

  if (!key) {
    return {
      table,
      ok: false,
      status: 0,
      message: "Chave do Supabase não configurada."
    };
  }

  try {
    const response = await fetch(buildRestUrl(table, { select: "*", limit: 1 }), {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        Prefer: "count=exact"
      },
      cache: "no-store"
    });

    const text = await response.text();
    let rows: unknown[] = [];

    try {
      rows = text ? JSON.parse(text) as unknown[] : [];
    } catch {
      rows = [];
    }

    const contentRange = response.headers.get("content-range");
    const countText = contentRange?.split("/").at(-1);
    const count = countText && countText !== "*" ? Number(countText) : null;
    const first = Array.isArray(rows) ? rows[0] : undefined;

    return {
      table,
      ok: response.ok,
      status: response.status,
      count: Number.isFinite(count) ? count : null,
      sampleKeys: first && typeof first === "object" ? Object.keys(first as Record<string, unknown>).slice(0, 12) : [],
      message: response.ok ? undefined : text
    };
  } catch (error) {
    return {
      table,
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "Falha ao consultar Supabase."
    };
  }
}
