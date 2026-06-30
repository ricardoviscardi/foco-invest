import { NextResponse } from "next/server";
import { checkSupabaseTable, getSupabaseConnectionStatus } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const tables = [
  "assets",
  "asset_quotes",
  "asset_price_history",
  "asset_financials",
  "asset_dividends",
  "asset_indicators"
];

export async function GET() {
  const connection = getSupabaseConnectionStatus();

  if (!connection.configured) {
    return NextResponse.json({
      connected: false,
      connection,
      tables: []
    }, { status: 200 });
  }

  const tableStatuses = await Promise.all(tables.map((table) => checkSupabaseTable(table)));
  const connected = tableStatuses.every((table) => table.ok);

  return NextResponse.json({
    connected,
    connection: {
      ...connection,
      // Não devolvemos nenhuma chave, só o tipo.
      keyConfigured: connection.keyConfigured,
      keyType: connection.keyType
    },
    tables: tableStatuses,
    nextStep: connected
      ? "Conexão com Supabase ok. Agora é possível popular as tabelas com scripts Python."
      : "Alguma tabela falhou. Verifique se o schema foi executado e se a chave tem permissão."
  });
}
