import type { CompanyInfoRow } from "@/types/stock";
import { Card } from "@/components/ui/Card";
import { sameDisplayText, sanitizeDisplayText } from "@/lib/utils/text";

type CompanyInfoCardProps = {
  rows: CompanyInfoRow[];
};

function normalizeRows(rows: CompanyInfoRow[]) {
  const sanitizedRows = rows.map((row) => ({
    label: row.label,
    value: sanitizeDisplayText(row.value) || "Não disponível"
  }));

  const sector = sanitizedRows.find((row) => row.label === "Setor")?.value;

  return sanitizedRows.filter((row) => {
    if (["CNPJ", "Site"].includes(row.label) && row.value === "Não disponível") {
      return false;
    }

    if ((row.label === "Indústria" || row.label === "Segmento") && sameDisplayText(row.value, sector)) {
      return false;
    }

    return true;
  });
}

export function CompanyInfoCard({ rows }: CompanyInfoCardProps) {
  const visibleRows = normalizeRows(rows);

  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
        Empresa
      </p>

      <div className="mt-5 grid gap-3">
        {visibleRows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-3 last:border-b-0 last:pb-0">
            <p className="text-sm text-[var(--color-muted)]">{row.label}</p>
            <p className="max-w-[62%] break-words text-right text-sm font-bold text-[var(--color-text)]">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
