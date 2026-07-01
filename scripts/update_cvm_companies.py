"""
v1.44 - Cadastro e fundamentos oficiais de companhias abertas via CVM.

Complementa a base do Supabase com CNPJ, código CVM, Balanço, DRE,
Fluxo de Caixa e indicadores calculados.

Antes de rodar, execute `supabase/v1-44-cvm-cadastro.sql` no SQL Editor.

Exemplos:
    python scripts/update_cvm_companies.py --tickers ABEV3 PETR4 CMIG4
    python scripts/update_cvm_companies.py --all --years 2025 2024 2023 2022 2021
    python scripts/update_cvm_companies.py --all --years 2025 2024 2023 2022 2021 --itr-years 2026 2025
"""
from __future__ import annotations

import argparse, io, math, os, re, socket, time, unicodedata, zipfile
from datetime import date, datetime, timezone
from difflib import SequenceMatcher
from typing import Any

import pandas as pd
import requests
import urllib3.util.connection as urllib3_connection

from config import get_required_env, load_project_env
from supabase_rest import SupabaseConfig, SupabaseRestClient
from tickers import STOCK_TICKERS

CVM_CAD_URL = "https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv"
DFP_URL_TEMPLATE = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/dfp_cia_aberta_{year}.zip"
ITR_URL_TEMPLATE = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/ITR/DADOS/itr_cia_aberta_{year}.zip"

CVM_RETRY_ATTEMPTS = int(os.environ.get("CVM_RETRY_ATTEMPTS", "6"))
CVM_RETRY_BASE_SLEEP = float(os.environ.get("CVM_RETRY_BASE_SLEEP", "10"))
CVM_FORCE_IPV4 = os.environ.get("CVM_FORCE_IPV4", "1").lower() not in {"0", "false", "no", "nao"}

if CVM_FORCE_IPV4:
    # Em alguns runners do GitHub Actions, o domínio da CVM pode resolver IPv6
    # sem rota disponível, gerando Errno 101: Network is unreachable.
    # Forçar IPv4 torna o download mais estável nesses casos.
    def _cvm_allowed_gai_family() -> socket.AddressFamily:
        return socket.AF_INET

    urllib3_connection.allowed_gai_family = _cvm_allowed_gai_family

CVM_SESSION = requests.Session()
CVM_SESSION.headers.update({
    "User-Agent": "FocoInvestDataUpdater/1.53.3 (+https://github.com/ricardoviscardi/foco-invest)",
    "Accept": "text/csv,application/zip,application/octet-stream,*/*",
})

TICKER_HINTS: dict[str, list[str]] = {
    "ABEV3":["AMBEV"], "PETR3":["PETROLEO BRASILEIRO","PETROBRAS"], "PETR4":["PETROLEO BRASILEIRO","PETROBRAS"],
    "VALE3":["VALE"], "ITUB3":["ITAU UNIBANCO","ITAÚ UNIBANCO"], "ITUB4":["ITAU UNIBANCO","ITAÚ UNIBANCO"],
    "BBAS3":["BANCO DO BRASIL"], "BBDC3":["BANCO BRADESCO"], "BBDC4":["BANCO BRADESCO"], "BBSE3":["BB SEGURIDADE"],
    "B3SA3":["B3 S.A", "BRASIL BOLSA BALCAO"], "WEGE3":["WEG"], "CMIG3":["CEMIG","COMPANHIA ENERGETICA DE MINAS GERAIS"],
    "CMIG4":["CEMIG","COMPANHIA ENERGETICA DE MINAS GERAIS"], "POMO4":["MARCOPOLO"], "RANI3":["IRANI"],
    "CSMG3":["COPASA","COMPANHIA DE SANEAMENTO DE MINAS GERAIS"], "TAEE11":["TAESA","TRANSMISSORA ALIANCA"],
    "KLBN11":["KLABIN"], "SUZB3":["SUZANO"], "EGIE3":["ENGIE BRASIL"], "CPLE3":["COPEL","COMPANHIA PARANAENSE DE ENERGIA"],
    "CPLE6":["COPEL","COMPANHIA PARANAENSE DE ENERGIA"], "RENT3":["LOCALIZA"], "LREN3":["LOJAS RENNER"],
    "RAIL3":["RUMO"], "MGLU3":["MAGAZINE LUIZA"], "TOTS3":["TOTVS"], "PRIO3":["PETRO RIO","PRIO"],
    "ELET3":["ELETROBRAS","CENTRAIS ELETRICAS BRASILEIRAS"], "ELET6":["ELETROBRAS","CENTRAIS ELETRICAS BRASILEIRAS"],
    "GGBR4":["GERDAU"], "GOAU4":["METALURGICA GERDAU"], "JBSS3":["JBS"], "BRFS3":["BRF"], "BRKM5":["BRASKEM"],
    "RADL3":["RAIA DROGASIL","RD SAUDE"], "VIVT3":["TELEFONICA BRASIL"], "TIMS3":["TIM"], "SBSP3":["SABESP"],
    "HYPE3":["HYPERA"], "EMBR3":["EMBRAER"], "BEEF3":["MINERVA"], "MRFG3":["MARFRIG"], "CSNA3":["SIDERURGICA NACIONAL"],
    "USIM5":["USIMINAS"], "VBBR3":["VIBRA ENERGIA"], "UGPA3":["ULTRAPAR"], "ENEV3":["ENEVA"], "EQTL3":["EQUATORIAL"],
    "NEOE3":["NEOENERGIA"], "SANB11":["SANTANDER BRASIL","BANCO SANTANDER"], "SAPR11":["SANEPAR"], "PSSA3":["PORTO SEGURO"],
}

def norm(v: Any) -> str:
    if v is None: return ""
    s=unicodedata.normalize("NFD",str(v).upper())
    s="".join(ch for ch in s if unicodedata.category(ch)!="Mn")
    s=re.sub(r"[^A-Z0-9]+"," ",s)
    s=re.sub(r"\b(S A|SA|CIA|COMPANHIA|ON|PN|N1|N2|NM|UNIT|UNT|PREF|ORD)\b"," ",s)
    return re.sub(r"\s+"," ",s).strip()

def to_num(v: Any) -> float|None:
    if v is None: return None
    try:
        if pd.isna(v): return None
    except TypeError: pass
    s=str(v).strip()
    if not s: return None
    try: n=float(s.replace(".","").replace(",","."))
    except ValueError: return None
    return n if math.isfinite(n) else None

def parse_dt(v: Any) -> str|None:
    try: d=pd.to_datetime(v, errors="coerce").date()
    except Exception: return None
    if pd.isna(d): return None
    return d.isoformat()

def now_iso() -> str: return datetime.now(timezone.utc).isoformat()
def default_years() -> list[int]:
    y=date.today().year
    return [y-1,y-2,y-3,y-4,y-5]

def cvm_get(url: str, *, timeout: int = 120, attempts: int = CVM_RETRY_ATTEMPTS) -> requests.Response | None:
    """Baixa uma URL da CVM com novas tentativas.

    A CVM/GitHub Actions pode falhar temporariamente com erros como
    `Network is unreachable`. Uma falha isolada não deve derrubar toda a
    atualização sem antes tentar novamente.
    """
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            response = CVM_SESSION.get(url, timeout=timeout)
            if response.status_code == 404:
                print({"warning": "cvm_url_not_found", "url": url, "status_code": response.status_code})
                return None
            response.raise_for_status()
            return response
        except requests.RequestException as exc:
            last_error = exc
            wait_seconds = min(CVM_RETRY_BASE_SLEEP * attempt, 60)
            print({
                "warning": "cvm_download_retry",
                "attempt": attempt,
                "attempts": attempts,
                "wait_seconds": wait_seconds if attempt < attempts else 0,
                "url": url,
                "error": str(exc),
            })
            if attempt < attempts:
                time.sleep(wait_seconds)

    raise RuntimeError(
        f"Não foi possível acessar a CVM após {attempts} tentativas: {url}. "
        f"Último erro: {last_error}"
    ) from last_error

def read_csv_url(url: str) -> pd.DataFrame:
    r = cvm_get(url, timeout=120)
    if r is None:
        raise FileNotFoundError(f"Arquivo CVM não encontrado: {url}")
    return pd.read_csv(io.BytesIO(r.content), sep=";", encoding="latin1", dtype=str)

def read_cad() -> pd.DataFrame:
    df=read_csv_url(CVM_CAD_URL); df.columns=[str(c).strip() for c in df.columns]; return df

def load_assets(client: SupabaseRestClient, tickers: list[str]) -> list[dict[str,Any]]:
    if tickers:
        return client.select("assets", {"select":"ticker,kind,name,company_name,cnpj,sector,industry,website", "ticker":f"in.({','.join(tickers)})", "kind":"eq.stock", "limit":"1000"})
    return client.select("assets", {"select":"ticker,kind,name,company_name,cnpj,sector,industry,website", "kind":"eq.stock", "limit":"1000"})

def terms(asset: dict[str,Any]) -> list[str]:
    ticker=str(asset.get("ticker") or "").upper()
    out=[]; out.extend(TICKER_HINTS.get(ticker,[]))
    for k in ["company_name","name"]:
        if asset.get(k): out.append(str(asset[k]))
    seen=set(); final=[]
    for item in out:
        n=norm(item)
        if n and n not in seen: final.append(item); seen.add(n)
    return final

def match_company(asset: dict[str,Any], cad: pd.DataFrame) -> dict[str,Any]|None:
    cnpj_digits=re.sub(r"\D","",str(asset.get("cnpj") or ""))
    if cnpj_digits and "CNPJ_CIA" in cad.columns:
        m=cad[cad["CNPJ_CIA"].astype(str).str.replace(r"\D","",regex=True)==cnpj_digits]
        if not m.empty:
            row=m.iloc[0].to_dict(); row["_match_score"]=999; row["_match_term"]="CNPJ"; return row
    search=[norm(t) for t in terms(asset)]
    if not search: return None
    best=None
    for _,r in cad.iterrows():
        names=[norm(r.get("DENOM_SOCIAL")), norm(r.get("DENOM_COMERC"))]
        names=[n for n in names if n]
        if not names: continue
        score=0.0; term_hit=""
        for t in search:
            for name in names:
                s=SequenceMatcher(None,t,name).ratio()*100
                if t in name or name in t: s=max(s,92)
                if len(t)<=4 and t not in name.split(): s=min(s,60)
                if s>score: score=s; term_hit=t
        if "SIT" in cad.columns and "ATIVO" in norm(r.get("SIT")): score += 3
        if best is None or score>best[0]: best=(score,r,term_hit)
    if not best or best[0]<83: return None
    row=best[1].to_dict(); row["_match_score"]=round(best[0],2); row["_match_term"]=best[2]; return row

def st(v: Any) -> str|None:
    if v is None: return None
    s=str(v).strip(); return s or None

def int_or_none(v: Any) -> int|None:
    n=to_num(v); return int(n) if n is not None else None

def upsert_cad(client: SupabaseRestClient, asset: dict[str,Any], match: dict[str,Any]) -> dict[str,Any]:
    ticker=str(asset["ticker"]).upper(); code=int_or_none(match.get("CD_CVM"))
    payload={
        "ticker":ticker,"kind":"stock","name":st(asset.get("name")) or st(match.get("DENOM_COMERC")) or ticker,
        "company_name":st(match.get("DENOM_SOCIAL")) or st(asset.get("company_name")) or ticker,
        "cnpj":st(match.get("CNPJ_CIA")),"cvm_code":code,
        "sector":st(asset.get("sector")),"industry":st(asset.get("industry")),"website":st(asset.get("website")),
        "currency":"BRL","source":"Base própria consolidada","updated_at":now_iso()
    }
    try: client.upsert("assets", payload, on_conflict="ticker")
    except RuntimeError as e:
        if "cvm_code" not in str(e): raise
        payload.pop("cvm_code",None); client.upsert("assets", payload, on_conflict="ticker")
    return {"ticker":ticker,"cvm_code":code,"cnpj":payload.get("cnpj"),"match_score":match.get("_match_score"),"match_term":match.get("_match_term")}

def get_zip(url: str) -> zipfile.ZipFile|None:
    try:
        r = cvm_get(url, timeout=180)
        if r is None:
            return None
        return zipfile.ZipFile(io.BytesIO(r.content))
    except Exception as exc:
        print({"warning":"cvm_zip_failed","url":url,"error":str(exc)})
        return None

def member(zf: zipfile.ZipFile, parts: list[str]) -> str|None:
    for name in zf.namelist():
        low=name.lower()
        if all(p.lower() in low for p in parts): return name
    return None

def read_member(zf: zipfile.ZipFile, name: str|None) -> pd.DataFrame:
    if not name: return pd.DataFrame()
    with zf.open(name) as f: df=pd.read_csv(f, sep=";", encoding="latin1", dtype=str)
    df.columns=[str(c).strip() for c in df.columns]
    return df

def filter_rows(df: pd.DataFrame, code: int) -> pd.DataFrame:
    if df.empty or "CD_CVM" not in df.columns: return df.iloc[0:0]
    sub=df[df["CD_CVM"].astype(str)==str(code)]
    if "ORDEM_EXERC" in sub.columns:
        latest=sub[sub["ORDEM_EXERC"].map(norm).str.contains("ULTIMO", na=False)]
        if not latest.empty: sub=latest
    return sub

def mult(row: pd.Series) -> float:
    return 1000.0 if "MIL" in norm(row.get("ESCALA_MOEDA")) else 1.0

def refs(frames: list[pd.DataFrame]) -> list[str]:
    out=set()
    for df in frames:
        if df.empty: continue
        col="DT_FIM_EXERC" if "DT_FIM_EXERC" in df.columns else "DT_REFER" if "DT_REFER" in df.columns else None
        if not col: continue
        for raw in df[col].dropna().unique():
            d=parse_dt(raw)
            if d: out.add(d)
    return sorted(out, reverse=True)

def value(df: pd.DataFrame, ref: str, accounts: list[str], keywords: list[str]) -> float|None:
    if df.empty: return None
    col="DT_FIM_EXERC" if "DT_FIM_EXERC" in df.columns else "DT_REFER" if "DT_REFER" in df.columns else None
    period=df[df[col].astype(str).str[:10]==ref] if col else df
    if period.empty and col: period=df[df[col].astype(str).str[:4]==ref[:4]]
    if period.empty: return None
    if "CD_CONTA" in period.columns:
        for acc in accounts:
            m=period[period["CD_CONTA"].astype(str).str.strip()==acc]
            if not m.empty:
                n=to_num(m.iloc[0].get("VL_CONTA")); return None if n is None else n*mult(m.iloc[0])
    if "DS_CONTA" in period.columns:
        desc=period["DS_CONTA"].map(norm)
        for kw in keywords:
            words=norm(kw).split()
            m=period[desc.apply(lambda t: all(w in t for w in words))]
            if not m.empty:
                n=to_num(m.iloc[0].get("VL_CONTA")); return None if n is None else n*mult(m.iloc[0])
    return None

def qlabel(ref: str) -> str:
    q=max(1,min(4,math.ceil(int(ref[5:7])/3)))
    return f"{q}T"



def choose_frame(zf: zipfile.ZipFile, frame_code: str, year: int) -> tuple[str | None, pd.DataFrame]:
    """
    Localiza e lê um quadro dentro do ZIP da CVM, preferindo arquivos consolidados.

    Exemplos dentro dos ZIPs da CVM:
    - dfp_cia_aberta_BPA_con_2024.csv
    - dfp_cia_aberta_BPA_ind_2024.csv
    - itr_cia_aberta_DRE_con_2025.csv

    Retorna (nome_do_arquivo, dataframe). Se o quadro não existir, retorna
    (None, DataFrame vazio), permitindo fallback para outros quadros.
    """
    code = str(frame_code or "").strip().upper()
    year_text = str(year)

    def candidate_score(name: str) -> int:
        base = name.split("/")[-1].lower()
        if not base.endswith(".csv"):
            return -1
        if code.lower() not in base or year_text not in base:
            return -1

        score = 10
        if f"_{code.lower()}_con_" in base:
            score += 100
        elif f"_{code.lower()}_ind_" in base:
            score += 80
        else:
            score += 40

        if base.startswith("dfp_cia_aberta") or base.startswith("itr_cia_aberta"):
            score += 10
        return score

    candidates = [name for name in zf.namelist() if candidate_score(name) >= 0]
    if not candidates:
        return None, pd.DataFrame()

    selected = sorted(candidates, key=candidate_score, reverse=True)[0]
    df = read_member(zf, selected)
    return selected, df


def normalize_cvm_code(value: Any) -> int | None:
    """Normaliza o código CVM para inteiro."""
    return int_or_none(value)


def references(frames: list[pd.DataFrame]) -> list[str]:
    """Compatibilidade com a versão atual de rows_from_zip."""
    return refs(frames)


def value_for(df: pd.DataFrame, ref: str, accounts: list[str], keywords: list[str]) -> float | None:
    """Compatibilidade com a versão atual de rows_from_zip."""
    return value(df, ref, accounts, keywords)


def quarter_label(ref: str) -> str:
    """Compatibilidade com a versão atual de rows_from_zip."""
    return qlabel(ref)

def rows_from_zip(
    zf: zipfile.ZipFile,
    year: int,
    document_type: str,
    companies: dict[str, dict[str, Any]],
    verbose: bool = True
) -> list[dict[str, Any]]:
    bpa_member, bpa = choose_frame(zf, "BPA", year)
    bpp_member, bpp = choose_frame(zf, "BPP", year)
    dre_member, dre = choose_frame(zf, "DRE", year)

    dfc_member, dfc = choose_frame(zf, "DFC_MI", year)
    if dfc.empty:
        dfc_member, dfc = choose_frame(zf, "DFC_MD", year)

    if verbose:
        print({
            "doc": document_type.upper(),
            "year": year,
            "members": {
                "BPA": bpa_member,
                "BPP": bpp_member,
                "DRE": dre_member,
                "DFC": dfc_member,
            },
            "frame_rows": {
                "BPA": len(bpa),
                "BPP": len(bpp),
                "DRE": len(dre),
                "DFC": len(dfc),
            },
            "companies": len(companies),
        })

    output: list[dict[str, Any]] = []

    for ticker, company in companies.items():
        cvm_code = normalize_cvm_code(company.get("cvm_code"))
        if cvm_code is None:
            continue

        frames = {
            "bpa": filter_rows(bpa, cvm_code),
            "bpp": filter_rows(bpp, cvm_code),
            "dre": filter_rows(dre, cvm_code),
            "dfc": filter_rows(dfc, cvm_code),
        }

        refs = references(list(frames.values()))
        if not refs:
            continue

        for reference_date in refs[:4 if document_type == "itr" else 1]:
            period_type = "annual" if document_type == "dfp" else "quarterly"

            current_assets = value_for(frames["bpa"], reference_date, ["1.01"], ["Ativo Circulante"])
            non_current_assets = value_for(frames["bpa"], reference_date, ["1.02"], ["Ativo Não Circulante", "Ativo Nao Circulante"])
            cash_and_equivalents = value_for(frames["bpa"], reference_date, ["1.01.01"], ["Caixa e Equivalentes", "Caixa"])
            total_assets = value_for(frames["bpa"], reference_date, ["1"], ["Ativo Total", "Total do Ativo"])

            current_liabilities = value_for(frames["bpp"], reference_date, ["2.01"], ["Passivo Circulante"])
            non_current_liabilities = value_for(frames["bpp"], reference_date, ["2.02"], ["Passivo Não Circulante", "Passivo Nao Circulante"])
            total_liabilities = None
            if current_liabilities is not None or non_current_liabilities is not None:
                total_liabilities = (current_liabilities or 0) + (non_current_liabilities or 0)

            equity = value_for(frames["bpp"], reference_date, ["2.03"], ["Patrimônio Líquido", "Patrimonio Liquido"])
            short_term_debt = value_for(frames["bpp"], reference_date, ["2.01.04"], ["Empréstimos e Financiamentos", "Emprestimos e Financiamentos", "Financiamentos"])
            long_term_debt = value_for(frames["bpp"], reference_date, ["2.02.01"], ["Empréstimos e Financiamentos", "Emprestimos e Financiamentos", "Financiamentos"])

            revenue = value_for(frames["dre"], reference_date, ["3.01"], ["Receita Líquida", "Receita Liquida", "Receita de Venda"])
            cost_of_revenue = value_for(frames["dre"], reference_date, ["3.02"], ["Custo dos Bens", "Custo dos Produtos", "Custo dos Serviços", "Custo"])
            gross_profit = value_for(frames["dre"], reference_date, ["3.03"], ["Resultado Bruto", "Lucro Bruto"])
            operating_expenses = value_for(frames["dre"], reference_date, ["3.04"], ["Despesas Receitas Operacionais", "Despesas Operacionais"])
            ebit = value_for(frames["dre"], reference_date, ["3.05"], ["Resultado Antes do Resultado Financeiro", "Resultado Operacional"])
            financial_result = value_for(frames["dre"], reference_date, ["3.06"], ["Resultado Financeiro"])
            income_before_tax = value_for(frames["dre"], reference_date, ["3.07"], ["Resultado Antes dos Tributos", "Lucro Antes dos Impostos"])
            income_tax = value_for(frames["dre"], reference_date, ["3.08"], ["Imposto de Renda", "Contribuição Social", "Contribuicao Social"])
            net_income = value_for(frames["dre"], reference_date, ["3.11", "3.13"], ["Lucro Prejuízo Consolidado do Período", "Lucro Prejuizo Consolidado do Periodo", "Lucro Líquido", "Lucro Liquido"])

            operating_cash_flow = value_for(frames["dfc"], reference_date, ["6.01"], ["Atividades Operacionais"])
            investing_cash_flow = value_for(frames["dfc"], reference_date, ["6.02"], ["Atividades de Investimento"])
            financing_cash_flow = value_for(frames["dfc"], reference_date, ["6.03"], ["Atividades de Financiamento"])
            capex = value_for(frames["dfc"], reference_date, ["6.02.01"], ["Imobilizado", "Ativo Imobilizado"])
            dividends_paid = value_for(frames["dfc"], reference_date, ["6.03.04"], ["Dividendos", "Juros sobre Capital Próprio", "Juros sobre Capital Proprio"])
            net_change_cash = value_for(frames["dfc"], reference_date, ["6.05"], ["Aumento Redução de Caixa", "Aumento Reducao de Caixa", "Variação de Caixa", "Variacao de Caixa"])

            free_cash_flow = None
            if operating_cash_flow is not None or capex is not None:
                free_cash_flow = (operating_cash_flow or 0) + (capex or 0)

            # EBITDA não é padronizado nas DFP/ITR como conta obrigatória. Mantemos em branco
            # até haver uma fonte/cálculo confiável para cada empresa.
            row = {
                "ticker": ticker,
                "period_type": period_type,
                "reference_year": int(reference_date[:4]),
                "reference_period": "Ano" if period_type == "annual" else quarter_label(reference_date),
                "reference_date": reference_date,
                "total_assets": total_assets,
                "current_assets": current_assets,
                "non_current_assets": non_current_assets,
                "cash_and_equivalents": cash_and_equivalents,
                "total_liabilities": total_liabilities,
                "current_liabilities": current_liabilities,
                "non_current_liabilities": non_current_liabilities,
                "short_term_debt": short_term_debt,
                "long_term_debt": long_term_debt,
                "equity": equity,
                "revenue": revenue,
                "cost_of_revenue": cost_of_revenue,
                "gross_profit": gross_profit,
                "operating_expenses": operating_expenses,
                "ebit": ebit,
                "ebitda": None,
                "financial_result": financial_result,
                "income_before_tax": income_before_tax,
                "income_tax": income_tax,
                "net_income": net_income,
                "operating_cash_flow": operating_cash_flow,
                "investing_cash_flow": investing_cash_flow,
                "financing_cash_flow": financing_cash_flow,
                "capex": capex,
                "dividends_paid": dividends_paid,
                "free_cash_flow": free_cash_flow,
                "net_change_cash": net_change_cash,
                "source": "Base própria consolidada",
                "updated_at": now_iso(),
            }

            if any(row[key] is not None for key in ["total_assets", "equity", "revenue", "net_income", "operating_cash_flow"]):
                output.append(row)

    return output

def latest_one(client: SupabaseRestClient, table: str, ticker: str) -> dict[str,Any]|None:
    order="quote_date.desc" if table=="asset_quotes" else "reference_date.desc"
    rows=client.select(table,{"select":"*","ticker":f"eq.{ticker}","order":order,"limit":"1"})
    return rows[0] if rows else None

def indicator_from_row(client: SupabaseRestClient, row: dict[str,Any]) -> dict[str,Any]|None:
    ticker=row["ticker"]; q=latest_one(client,"asset_quotes",ticker) or {}; old=latest_one(client,"asset_indicators",ticker) or {}
    price=to_num(q.get("price")); mcap=to_num(q.get("market_cap")) or to_num(old.get("market_cap")); shares=to_num(old.get("shares_outstanding"))
    eq=to_num(row.get("equity")); assets=to_num(row.get("total_assets")); rev=to_num(row.get("revenue")); ni=to_num(row.get("net_income")); ebit=to_num(row.get("ebit")); ebitda=to_num(row.get("ebitda"))
    if not mcap and price and shares: mcap=price*shares
    ind={
        "ticker":ticker,"reference_date":row["reference_date"],"pe":(mcap/ni if mcap and ni and ni>0 else None),"pvp":(mcap/eq if mcap and eq and eq>0 else None),
        "dividend_yield":to_num(old.get("dividend_yield")),"roe":((ni/eq)*100 if ni and eq and eq>0 else None),"roa":((ni/assets)*100 if ni and assets and assets>0 else None),
        "roic":((ebit/assets)*100 if ebit and assets and assets>0 else None),"net_margin":((ni/rev)*100 if ni and rev and rev!=0 else None),
        "ev_ebitda":(mcap/ebitda if mcap and ebitda and ebitda>0 else to_num(old.get("ev_ebitda"))),"debt_ebitda":to_num(old.get("debt_ebitda")),
        "book_value_per_share":(eq/shares if eq and shares and shares>0 else to_num(old.get("book_value_per_share"))),"market_cap":mcap,"shares_outstanding":shares,
        "vp_per_share":(eq/shares if eq and shares and shares>0 else to_num(old.get("vp_per_share"))),"dividend_per_share":to_num(old.get("dividend_per_share")),
        "source":"Base própria consolidada","updated_at":now_iso(),
    }
    return ind if any(ind[k] is not None for k in ["pe","pvp","roe","roa","net_margin","market_cap","book_value_per_share"]) else None

def parser() -> argparse.ArgumentParser:
    p=argparse.ArgumentParser(description="Atualiza cadastro e fundamentos de ações via CVM.")
    g=p.add_mutually_exclusive_group(); g.add_argument("--all",action="store_true"); g.add_argument("--tickers",nargs="+")
    p.add_argument("--years",nargs="+",type=int,default=default_years()); p.add_argument("--itr-years",nargs="+",type=int,default=[])
    p.add_argument("--skip-financials",action="store_true"); p.add_argument("--limit",type=int,default=None)
    return p

def main() -> int:
    args=parser().parse_args(); load_project_env()
    client=SupabaseRestClient(SupabaseConfig(url=get_required_env("SUPABASE_URL"), key=get_required_env("SUPABASE_SERVICE_ROLE_KEY")))
    if args.all:
        tickers=[]
    else:
        tickers=[t.upper().replace(".SA","") for t in args.tickers] if args.tickers else STOCK_TICKERS
    if args.limit and tickers:
        tickers=tickers[:args.limit]
    assets=load_assets(client,tickers)
    if args.limit and not tickers:
        assets=assets[:args.limit]
    if not assets:
        print("Nenhuma ação encontrada no Supabase. Rode primeiro update_base_inicial.py ou update_prices_yahoo.py."); return 0
    cad=read_cad(); companies={}; misses=[]; matches=[]
    for asset in assets:
        ticker=str(asset.get("ticker") or "").upper(); m=match_company(asset,cad)
        if not m: misses.append(ticker); continue
        payload=upsert_cad(client,asset,m); matches.append(payload)
        if payload.get("cvm_code"): companies[ticker]=payload
    print({"stage":"cadastro_cvm","matched":len(matches),"miss_count":len(misses),"misses":misses[:30]})
    if args.skip_financials: return 0
    fin=[]
    for year in args.years:
        z=get_zip(DFP_URL_TEMPLATE.format(year=year))
        if not z: print({"doc":"DFP","year":year,"ok":False}); continue
        rows=rows_from_zip(z,year,"dfp",companies); fin.extend(rows); print({"doc":"DFP","year":year,"rows":len(rows)})
    for year in args.itr_years:
        z=get_zip(ITR_URL_TEMPLATE.format(year=year))
        if not z: print({"doc":"ITR","year":year,"ok":False}); continue
        rows=rows_from_zip(z,year,"itr",companies); fin.extend(rows); print({"doc":"ITR","year":year,"rows":len(rows)})
    for i in range(0,len(fin),500): client.upsert("asset_financials", fin[i:i+500], on_conflict="ticker,period_type,reference_year,reference_period")
    inds=[]
    for row in fin:
        if row["period_type"]=="annual":
            ind=indicator_from_row(client,row)
            if ind: inds.append(ind)
    for i in range(0,len(inds),500): client.upsert("asset_indicators", inds[i:i+500], on_conflict="ticker,reference_date")
    print({"finished":True,"matched":len(matches),"miss_count":len(misses),"financial_rows":len(fin),"indicator_rows":len(inds),"financial_count":client.select_count("asset_financials"),"indicator_count":client.select_count("asset_indicators")})
    return 0

if __name__=="__main__": raise SystemExit(main())
