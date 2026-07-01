# Correção v1.53.15 — Escala, DY e card Empresa

Esta versão corrige três problemas vistos na validação local:

1. Demonstrativos com escala quebrada, gerando valores absurdos como `R$ 203.645.900 tri`.
2. Indicadores anuais contaminados por demonstrativos ou indicadores históricos ruins.
3. Dividend Yield inflado em ativos como WEGE3/MGLU3 por eventos de proventos ajustados por split/grupamento.
4. Textos longos, especialmente site da empresa, saindo do card lateral.

## Como testar

Após substituir os arquivos:

```powershell
cd C:\Users\38405395873\Documents\Web\foco-invest
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run dev
```

Abra:

```text
http://localhost:3000/api/data/asset/lren3
http://localhost:3000/acoes/lren3
http://localhost:3000/acoes/wege3
http://localhost:3000/acoes/mglu3
```

## O que observar

- Balanço, DRE e Fluxo de Caixa não devem exibir valores em `tri` absurdos para ações como LREN3.
- VPA não deve aparecer com valor gigante ou casas/escala quebrada.
- Dividend Yield não deve ser inflado por proventos ajustados.
- URL do site não deve sair do card Empresa.
