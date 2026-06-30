import { NextResponse } from "next/server";
import { getStockFromSupabase } from "@/lib/stocks/supabase-stock-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const stock = await getStockFromSupabase(ticker);

  return NextResponse.json({
    ticker: ticker.toUpperCase(),
    found: Boolean(stock),
    stock
  });
}
