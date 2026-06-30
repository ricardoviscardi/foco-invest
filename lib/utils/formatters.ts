export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Não disponível";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Não disponível";
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)}%`;
}

export function formatPlainPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Não disponível";
  }

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Não disponível";
  }

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2
  }).format(value);
}

export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Não disponível";
  }

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatLargeCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Não disponível";
  }

  if (Math.abs(value) >= 1_000_000_000_000) {
    return `R$ ${formatNumber(value / 1_000_000_000_000)} tri`;
  }

  if (Math.abs(value) >= 1_000_000_000) {
    return `R$ ${formatNumber(value / 1_000_000_000)} bi`;
  }

  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${formatNumber(value / 1_000_000)} mi`;
  }

  return formatCurrency(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Não disponível";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo"
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo"
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short"
  });
}
