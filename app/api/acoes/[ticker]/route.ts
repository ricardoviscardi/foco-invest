import { NextResponse } from "next/server";
import { getStockByTicker } from "@/lib/stocks/stock-service";

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const stock = await getStockByTicker(ticker);

  return NextResponse.json(stock);
}
