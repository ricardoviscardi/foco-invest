import { NextResponse } from "next/server";
import { checkSupabaseTable, getSupabaseConnectionStatus } from "@/lib/supabase/server";
import { getSnapshotStatus } from "@/lib/stocks/local-snapshot-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const tables = [
  "assets",
  "asset_quotes",
  "asset_price_history",
  "asset_financials",
  "asset_dividends",
  "asset_indicators",
];

function hasNetworkBlock(tableStatuses: Awaited<ReturnType<typeof checkSupabaseTable>>[]) {
  return tableStatuses.some((table) =>
    String(table.message ?? "").toLowerCase().includes("malware.opendns.com") ||
    String(table.message ?? "").toLowerCase().includes("opendns") ||
    String(table.message ?? "").toLowerCase().includes("cisco umbrella"),
  );
}

export async function GET() {
  const connection = getSupabaseConnectionStatus();
  const snapshot = getSnapshotStatus();

  if (!connection.configured) {
    return NextResponse.json({
      connected: false,
      blockedByNetwork: false,
      connection,
      snapshot,
      tables: [],
      nextStep: "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    }, { status: 200 });
  }

  const tableStatuses = await Promise.all(tables.map((table) => checkSupabaseTable(table)));
  const connected = tableStatuses.every((table) => table.ok);
  const blockedByNetwork = hasNetworkBlock(tableStatuses);

  return NextResponse.json({
    connected,
    blockedByNetwork,
    connection: {
      ...connection,
      keyConfigured: connection.keyConfigured,
      keyType: connection.keyType,
    },
    snapshot,
    tables: tableStatuses,
    nextStep: connected
      ? "Conexão com Supabase ok. As páginas devem usar a base completa."
      : blockedByNetwork
        ? "A rede local está bloqueando o domínio do Supabase via OpenDNS/Cisco Umbrella. Teste em outra internet, libere o domínio na rede ou use o snapshot local exportado pelo GitHub Actions."
        : "Alguma tabela falhou. Verifique se o schema foi executado e se a chave tem permissão.",
  });
}
