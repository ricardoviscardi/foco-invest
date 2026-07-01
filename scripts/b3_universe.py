from __future__ import annotations

import os
import re
from typing import Any

import requests

FALLBACK_B3_STOCK_TICKERS = ['AALR3', 'ABCB4', 'ABEV3', 'AERI3', 'AESB3', 'AFLT3', 'AGRO3', 'AGXY3', 'ALLD3', 'ALPA3', 'ALPA4', 'ALUP11', 'ALUP3', 'ALUP4', 'AMAR3', 'AMBP3', 'AMER3', 'ANIM3', 'ARML3', 'ASAI3', 'AURE3', 'AZUL4', 'B3SA3', 'BAUH4', 'BBAS3', 'BBDC3', 'BBDC4', 'BBSE3', 'BEEF3', 'BEES3', 'BEES4', 'BGIP3', 'BGIP4', 'BHIA3', 'BLAU3', 'BMEB3', 'BMEB4', 'BMGB4', 'BMIN3', 'BMIN4', 'BMKS3', 'BPAC11', 'BPAC3', 'BPAC5', 'BPAN4', 'BRAP3', 'BRAP4', 'BRAV3', 'BRBI11', 'BRFS3', 'BRKM3', 'BRKM5', 'BRKM6', 'BRSR3', 'BRSR5', 'BRSR6', 'CAMB3', 'CAML3', 'CASH3', 'CBAV3', 'CEBR3', 'CEBR5', 'CEBR6', 'CEDO3', 'CEDO4', 'CEAB3', 'CGAS3', 'CGAS5', 'CGRA3', 'CGRA4', 'CLSC3', 'CLSC4', 'CMIG3', 'CMIG4', 'CMIN3', 'COCE3', 'COCE5', 'COGN3', 'CPFE3', 'CPLE3', 'CPLE5', 'CPLE6', 'CRFB3', 'CRPG3', 'CRPG5', 'CRPG6', 'CSAN3', 'CSED3', 'CSMG3', 'CSNA3', 'CTKA3', 'CTKA4', 'CTNM3', 'CTNM4', 'CURY3', 'CVCB3', 'CXSE3', 'CYRE3', 'DASA3', 'DESK3', 'DEXP3', 'DEXP4', 'DIRR3', 'DMVF3', 'DOHL3', 'DOHL4', 'DOTZ3', 'DXCO3', 'ECOR3', 'EGIE3', 'ELET3', 'ELET6', 'EMBR3', 'ENEV3', 'ENGI11', 'ENGI3', 'ENGI4', 'ENJU3', 'EQPA3', 'EQPA5', 'EQPA6', 'EQPA7', 'EQTL3', 'ESPA3', 'EVEN3', 'EZTC3', 'FESA3', 'FESA4', 'FHER3', 'FIGE3', 'FIGE4', 'FIQE3', 'FLRY3', 'FRAS3', 'FRIO3', 'GFSA3', 'GGBR3', 'GGBR4', 'GMAT3', 'GOAU3', 'GOAU4', 'GOLL4', 'GRND3', 'HAGA3', 'HAGA4', 'HAPV3', 'HBOR3', 'HBRE3', 'HBSA3', 'HYPE3', 'ICBR3', 'IFCM3', 'IGTI11', 'IGTI3', 'IGTI4', 'INEP3', 'INEP4', 'INTB3', 'IRBR3', 'ITSA3', 'ITSA4', 'ITUB3', 'ITUB4', 'JALL3', 'JBSS3', 'JFEN3', 'JHSF3', 'JOPA3', 'JOPA4', 'KEPL3', 'KLBN11', 'KLBN3', 'KLBN4', 'LAND3', 'LAVV3', 'LEVE3', 'LJQQ3', 'LOGG3', 'LOGN3', 'LPSB3', 'LREN3', 'LUPA3', 'LWSA3', 'MATD3', 'MBLY3', 'MDIA3', 'MEAL3', 'MELK3', 'MILS3', 'MLAS3', 'MNDL3', 'MNPR3', 'MOAR3', 'MOVI3', 'MRFG3', 'MRVE3', 'MTRE3', 'MTSA4', 'MULT3', 'MYPK3', 'NEOE3', 'NGRD3', 'NTCO3', 'ODPV3', 'OFSA3', 'OIBR3', 'OIBR4', 'ONCO3', 'OPCT3', 'ORVR3', 'PCAR3', 'PDGR3', 'PDTC3', 'PETR3', 'PETR4', 'PETZ3', 'PFRM3', 'PINE3', 'PINE4', 'PLAS3', 'PLPL3', 'PMAM3', 'PNVL3', 'POMO3', 'POMO4', 'PORT3', 'POSI3', 'PRIO3', 'PSSA3', 'PTBL3', 'PTNT3', 'PTNT4', 'QUAL3', 'RADL3', 'RAIL3', 'RAIZ4', 'RANI3', 'RAPT3', 'RAPT4', 'RDNI3', 'RDOR3', 'RECV3', 'RENT3', 'RNEW11', 'RNEW3', 'RNEW4', 'ROMI3', 'RPAD3', 'RPAD5', 'RPAD6', 'RRRP3', 'RSID3', 'SANB11', 'SANB3', 'SANB4', 'SAPR11', 'SAPR3', 'SAPR4', 'SBFG3', 'SBSP3', 'SCAR3', 'SEER3', 'SEQL3', 'SHOW3', 'SHUL4', 'SIMH3', 'SLCE3', 'SMFT3', 'SMTO3', 'SNSY3', 'SNSY5', 'SOJA3', 'SRNA3', 'STBP3', 'SUZB3', 'SYNE3', 'TAEE11', 'TAEE3', 'TAEE4', 'TASA3', 'TASA4', 'TECN3', 'TEND3', 'TGMA3', 'TIMS3', 'TKNO4', 'TOTS3', 'TPIS3', 'TRAD3', 'TRIS3', 'TRPL3', 'TRPL4', 'TTEN3', 'TUPY3', 'TXRX3', 'TXRX4', 'UCAS3', 'UGPA3', 'UNIP3', 'UNIP5', 'UNIP6', 'USIM3', 'USIM5', 'VALE3', 'VAMO3', 'VBBR3', 'VIVA3', 'VIVR3', 'VIVT3', 'VLID3', 'VSTE3', 'VTRU3', 'VULC3', 'VVEO3', 'WEGE3', 'WEST3', 'WHRL3', 'WHRL4', 'WIZC3', 'YDUQ3', 'ZAMP3']
UNIT_STOCK_TICKERS = ['ALUP11', 'BPAC11', 'ENGI11', 'IGTI11', 'KLBN11', 'RNEW11', 'SANB11', 'SAPR11', 'TAEE11']

BRAPI_LIST_URL = "https://brapi.dev/api/quote/list"


def normalize_ticker(value: Any) -> str | None:
    text = str(value or "").upper().replace(".SA", "")
    text = re.sub(r"[^A-Z0-9]", "", text)
    if not re.fullmatch(r"[A-Z]{4}[0-9]{1,2}", text):
        return None

    # Exclui a maior parte dos BDRs e FIIs. Units de ações são mantidas por lista.
    if text.endswith(("31", "32", "33", "34", "35", "39")):
        return None
    if text.endswith("11") and text not in UNIT_STOCK_TICKERS:
        return None

    return text


def unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for value in values:
        ticker = normalize_ticker(value)
        if ticker and ticker not in seen:
            seen.add(ticker)
            out.append(ticker)
    return out


def _extract_symbol(item: dict[str, Any]) -> str | None:
    return normalize_ticker(item.get("stock") or item.get("symbol") or item.get("ticker") or item.get("name"))


def _looks_like_stock(item: dict[str, Any]) -> bool:
    raw = " ".join(str(item.get(key) or "") for key in ["type", "kind", "assetType", "category", "sector"]).lower()
    if any(blocked in raw for blocked in ["fii", "fundo imobili", "etf", "bdr", "índice", "indice"]):
        return False
    return True


def discover_brapi_stock_tickers(limit: int = 2000) -> list[str]:
    token = os.environ.get("BRAPI_API_TOKEN") or os.environ.get("BRAPI_TOKEN")
    if not token:
        return []

    tickers: list[str] = []
    headers = {"Authorization": f"Bearer {token}"}

    for page in range(1, 8):
        params = {"limit": "200", "page": str(page), "sortBy": "name", "sortOrder": "asc"}
        try:
            response = requests.get(BRAPI_LIST_URL, params=params, headers=headers, timeout=60)
            if response.status_code >= 400:
                break
            payload = response.json()
        except Exception:
            break

        items = []
        for key in ["stocks", "results", "data", "items", "quotes"]:
            value = payload.get(key) if isinstance(payload, dict) else None
            if isinstance(value, list):
                items.extend(value)

        if not items:
            break

        for item in items:
            if not isinstance(item, dict) or not _looks_like_stock(item):
                continue
            symbol = _extract_symbol(item)
            if symbol:
                tickers.append(symbol)

        if len(items) < 200 or len(tickers) >= limit:
            break

    return unique(tickers)[:limit]


def load_b3_stock_tickers() -> list[str]:
    # Permite sobrescrever por secret/variável sem alterar código.
    custom = os.environ.get("B3_STOCK_TICKERS")
    if custom:
        return unique(re.split(r"[\s,;]+", custom))

    discovered = discover_brapi_stock_tickers()
    if len(discovered) >= 150:
        return discovered

    # Mescla descoberta parcial com fallback amplo. Tickers inválidos ou sem dados
    # são ignorados pelo atualizador e aparecem apenas no relatório.
    return unique([*discovered, *FALLBACK_B3_STOCK_TICKERS])
