from __future__ import annotations

import argparse
import subprocess
import sys


def run(command: list[str], *, optional: bool = False) -> bool:
    print({"running": " ".join(command)})
    completed = subprocess.run(command)
    if completed.returncode != 0:
        if optional:
            print({"warning": "Etapa opcional falhou, mas a rotina continuará.", "returncode": completed.returncode})
            return False
        raise SystemExit(completed.returncode)
    return True


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Atualiza toda a base monitorada de ações.")
    parser.add_argument("--sleep", type=float, default=1.0)
    parser.add_argument("--with-itr", action="store_true")
    parser.add_argument("--years", nargs="+", default=["2024", "2023", "2022", "2021"])
    parser.add_argument("--itr-years", nargs="+", default=["2025", "2024"])
    parser.add_argument("--skip-prices", action="store_true", help="Pula atualização de preço/histórico/proventos.")
    parser.add_argument("--skip-cvm", action="store_true", help="Pula atualização CVM.")
    parser.add_argument("--prices-optional", action="store_true", help="Continua para CVM mesmo se preços falharem.")
    parser.add_argument("--b3-stocks", action="store_true", help="Usa universo amplo/dinâmico de ações da B3 na etapa de preços.")
    return parser


def main() -> int:
    args = build_parser().parse_args()

    if not args.skip_prices:
        price_command = [sys.executable, "scripts/update_base_inicial.py", "--sleep", str(args.sleep)]
        price_command.append("--b3-stocks" if args.b3_stocks else "--stocks")
        run(price_command, optional=args.prices_optional)

    if not args.skip_cvm:
        cvm_command = [sys.executable, "scripts/update_cvm_companies.py", "--all", "--years", *args.years]
        if args.with_itr:
            cvm_command.extend(["--itr-years", *args.itr_years])
        run(cvm_command)

    run([sys.executable, "scripts/check_supabase_data.py"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
