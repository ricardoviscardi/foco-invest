export const popularStocks = [
  "PETR4",
  "PETR3",
  "VALE3",
  "ITUB4",
  "ITUB3",
  "BBAS3",
  "BBDC4",
  "BBDC3",
  "BBSE3",
  "WEGE3",
  "ABEV3",
  "TAEE11",
  "EGIE3",
  "CSMG3",
  "RANI3",
  "CMIG4",
  "CPLE6",
  "KLBN11",
  "SUZB3",
  "RENT3",
  "MGLU3",
  "LREN3",
  "RAIL3",
  "B3SA3"
];

export const popularFIIs = [
  "MXRF11",
  "HGLG11",
  "KNRI11",
  "XPML11",
  "VISC11",
  "XPLG11",
  "HGRU11",
  "BTLG11",
  "KNCR11",
  "RBRF11",
  "BCFF11",
  "HSML11"
];

export type StockSearchFallback = {
  symbol: string;
  name: string;
  sector?: string;
};

export const stockSuggestionsFallback: StockSearchFallback[] = [
  { symbol: "PETR4", name: "Petrobras PN", sector: "Petróleo e Gás" },
  { symbol: "PETR3", name: "Petrobras ON", sector: "Petróleo e Gás" },
  { symbol: "VALE3", name: "Vale ON", sector: "Mineração" },
  { symbol: "ITUB4", name: "Itaú Unibanco PN", sector: "Bancos" },
  { symbol: "ITUB3", name: "Itaú Unibanco ON", sector: "Bancos" },
  { symbol: "BBAS3", name: "Banco do Brasil ON", sector: "Bancos" },
  { symbol: "BBDC4", name: "Bradesco PN", sector: "Bancos" },
  { symbol: "BBDC3", name: "Bradesco ON", sector: "Bancos" },
  { symbol: "BBSE3", name: "BB Seguridade ON", sector: "Seguradoras" },
  { symbol: "WEGE3", name: "WEG ON", sector: "Máquinas e Equipamentos" },
  { symbol: "ABEV3", name: "Ambev ON", sector: "Bebidas" },
  { symbol: "TAEE11", name: "Taesa Unit", sector: "Energia Elétrica" },
  { symbol: "EGIE3", name: "Engie Brasil ON", sector: "Energia Elétrica" },
  { symbol: "CSMG3", name: "Copasa ON", sector: "Saneamento" },
  { symbol: "RANI3", name: "Irani ON", sector: "Papel e Embalagens" },
  { symbol: "CMIG4", name: "Cemig PN", sector: "Energia Elétrica" },
  { symbol: "CPLE6", name: "Copel PNB", sector: "Energia Elétrica" },
  { symbol: "KLBN11", name: "Klabin Unit", sector: "Papel e Celulose" },
  { symbol: "SUZB3", name: "Suzano ON", sector: "Papel e Celulose" },
  { symbol: "RENT3", name: "Localiza ON", sector: "Aluguel de veículos" },
  { symbol: "MGLU3", name: "Magazine Luiza ON", sector: "Varejo" },
  { symbol: "LREN3", name: "Lojas Renner ON", sector: "Varejo" },
  { symbol: "RAIL3", name: "Rumo ON", sector: "Transporte" },
  { symbol: "B3SA3", name: "B3 ON", sector: "Serviços Financeiros" },
  { symbol: "MXRF11", name: "Maxi Renda FII", sector: "FII" },
  { symbol: "HGLG11", name: "CSHG Logística FII", sector: "FII" },
  { symbol: "KNRI11", name: "Kinea Renda Imobiliária FII", sector: "FII" },
  { symbol: "XPML11", name: "XP Malls FII", sector: "FII" },
  { symbol: "VISC11", name: "Vinci Shopping Centers FII", sector: "FII" },
  { symbol: "XPLG11", name: "XP Log FII", sector: "FII" },
  { symbol: "HGRU11", name: "CSHG Renda Urbana FII", sector: "FII" },
  { symbol: "BTLG11", name: "BTG Pactual Logística FII", sector: "FII" },
  { symbol: "KNCR11", name: "Kinea Rendimentos Imobiliários FII", sector: "FII" },
  { symbol: "RBRF11", name: "RBR Alpha Multiestratégia FII", sector: "FII" },
  { symbol: "BCFF11", name: "BTG Pactual Fundo de Fundos FII", sector: "FII" },
  { symbol: "HSML11", name: "HSI Malls FII", sector: "FII" }
];


export const rankingStocks = [
  "PETR4", "PETR3", "VALE3", "ITUB4", "ITUB3", "BBAS3", "BBDC4", "BBDC3",
  "BBSE3", "WEGE3", "ABEV3", "TAEE11", "EGIE3", "CSMG3", "RANI3", "CMIG4",
  "CPLE6", "KLBN11", "SUZB3", "RENT3", "MGLU3", "LREN3", "RAIL3", "B3SA3",
  "ALPA4", "ASAI3", "AURE3", "AZUL4", "BEEF3", "BPAC11", "BRAP4", "BRFS3",
  "BRKM5", "BRSR6", "CCRO3", "CMIG3", "CMIN3", "COGN3", "CPFE3", "CPLE3",
  "CSAN3", "CSNA3", "CURY3", "CYRE3", "DIRR3", "DXCO3", "ECOR3", "ELET3",
  "ELET6", "EMBR3", "ENEV3", "ENGI11", "EQTL3", "EVEN3", "EZTC3", "FLRY3",
  "GGBR4", "GOAU4", "HAPV3", "HYPE3", "IRBR3", "ITSA3", "ITSA4", "JBSS3",
  "LEVE3", "MDIA3", "MILS3", "MOVI3", "MRFG3", "MRVE3", "MULT3", "NEOE3",
  "NTCO3", "ODPV3", "PCAR3", "POMO4", "PRIO3", "PSSA3", "RADL3", "RAIZ4",
  "RDOR3", "ROMI3", "SANB11", "SAPR11", "SBSP3", "SLCE3", "SMTO3", "STBP3",
  "TIMS3", "TOTS3", "TRPL4", "UGPA3", "USIM5", "VBBR3", "VIVT3", "VLID3",
  "YDUQ3"
];

export const rankingFIIs = [
  "MXRF11", "HGLG11", "KNRI11", "XPML11", "VISC11", "XPLG11", "HGRU11", "BTLG11",
  "KNCR11", "RBRF11", "BCFF11", "HSML11", "ALZR11", "BCRI11", "BRCO11", "BRCR11",
  "CPTS11", "DEVA11", "GGRC11", "HCTR11", "HGCR11", "HGPO11", "HGRE11", "HSLG11",
  "IRDM11", "JSRE11", "KFOF11", "KNCA11", "KNHY11", "KNIP11", "KNSC11", "LVBI11",
  "MALL11", "MCCI11", "OUJP11", "PVBI11", "RBRL11", "RBRP11", "RBRR11", "RBVA11",
  "RECR11", "RECT11", "RZTR11", "TEPP11", "TRXF11", "URPR11", "VGIR11", "VILG11",
  "VINO11", "VRTA11", "XPIN11", "XPPR11"
];
