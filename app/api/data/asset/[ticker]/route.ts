import { NextResponse } from "next/server";
import { getStockFromSupabase } from "@/lib/stocks/supabase-stock-repository";
import { getStockFromLocalSnapshot } from "@/lib/stocks/local-snapshot-repository";
import { getStockFromRemoteSnapshot } from "@/lib/stocks/remote-snapshot-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const supabaseStock = await getStockFromSupabase(ticker);
  const localSnapshotStock = supabaseStock ? null : await getStockFromLocalSnapshot(ticker);
  const remoteSnapshotStock = supabaseStock || localSnapshotStock
    ? null
    : await getStockFromRemoteSnapshot(ticker);
  const stock = supabaseStock ?? localSnapshotStock ?? remoteSnapshotStock;

  return NextResponse.json({
    ticker: ticker.toUpperCase(),
    found: Boolean(stock),
    source: supabaseStock
      ? "supabase"
      : localSnapshotStock
        ? "snapshot-local"
        : remoteSnapshotStock
          ? "snapshot-remoto"
          : null,
    stock,
  });
}
