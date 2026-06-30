import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FiiPageProps = {
  params: Promise<{
    ticker: string;
  }>;
};

export default async function FiiTickerPage({ params }: FiiPageProps) {
  const { ticker } = await params;
  redirect(`/acoes/${ticker.toLowerCase()}`);
}
