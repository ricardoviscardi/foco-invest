from __future__ import annotations

import argparse
import json
from pathlib import Path

DEFAULT_SNAPSHOT_DIR = Path(__file__).resolve().parents[1] / "public" / "data" / "snapshots" / "stocks"


def normalize_ticker(value: str) -> str:
    return "".join(ch for ch in value.upper().strip().replace(".SA", "") if ch.isalnum())


def count_useful_financial_years(financials: list[dict]) -> int:
    years: set[str] = set()
    for row in financials:
        if row.get("period_type") != "annual":
            continue
        year = row.get("reference_year")
        if not year and row.get("reference_date"):
            year = str(row.get("reference_date"))[:4]
        if year:
            years.add(str(year))
    return len(years)


def verify_ticker(snapshot_dir: Path, ticker: str, min_annual_years: int, min_history: int) -> dict:
    ticker = normalize_ticker(ticker)
    file_path = snapshot_dir / f"{ticker}.json"
    if not file_path.exists():
        return {"ticker": ticker, "ok": False, "error": "snapshot_file_missing", "file": str(file_path)}

    payload = json.loads(file_path.read_text(encoding="utf-8"))
    financials = payload.get("financials") or []
    dividends = payload.get("dividendRows") or []
    indicators = payload.get("indicatorRows") or []
    history = payload.get("historyRows") or []
    annual_years = count_useful_financial_years(financials)

    errors: list[str] = []
    if not payload.get("asset"):
        errors.append("asset_missing")
    if len(history) < min_history:
        errors.append(f"history_rows_lt_{min_history}")
    if annual_years < min_annual_years:
        errors.append(f"annual_financial_years_lt_{min_annual_years}")
    if len(indicators) == 0:
        errors.append("indicator_rows_empty")

    return {
        "ticker": ticker,
        "ok": not errors,
        "errors": errors,
        "annual_financial_years": annual_years,
        "financials": len(financials),
        "dividends": len(dividends),
        "indicators": len(indicators),
        "history": len(history),
        "file": str(file_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Valida se o snapshot exportado tem dados suficientes para as páginas de ações.")
    parser.add_argument("--snapshot-dir", default=str(DEFAULT_SNAPSHOT_DIR))
    parser.add_argument("--ticker", action="append", default=["PETR3", "PETR4", "ABEV3", "LREN3", "RENT3", "CMIG4", "SUZB3"])
    parser.add_argument("--min-annual-years", type=int, default=3)
    parser.add_argument("--min-history", type=int, default=200)
    args = parser.parse_args()

    snapshot_dir = Path(args.snapshot_dir)
    results = [verify_ticker(snapshot_dir, ticker, args.min_annual_years, args.min_history) for ticker in args.ticker]
    print(json.dumps({"snapshot_dir": str(snapshot_dir), "results": results}, ensure_ascii=False, indent=2))

    failed = [item for item in results if not item["ok"]]
    if failed:
        print({"ok": False, "message": "Snapshot insuficiente. As páginas continuarão pobres sem estes dados."})
        return 1

    print({"ok": True, "message": "Snapshot validado."})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
