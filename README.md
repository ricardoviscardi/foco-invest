# Foco Invest

Projeto Next.js + TypeScript + Tailwind para consulta pública de ações brasileiras, fundamentos, indicadores, proventos e rankings.

## Versão atual

**v1.53.3 — Correção de rede CVM no GitHub Actions**

## Correção v1.53.3

Esta versão ajusta a etapa de download da CVM no GitHub Actions.

O erro observado foi:

```text
Errno 101: Network is unreachable
```

Ajustes aplicados:

```text
1. Mantém tentativas automáticas de download da CVM.
2. Força IPv4 nos requests para dados.cvm.gov.br.
3. Define CVM_FORCE_IPV4=1 nos workflows do GitHub Actions.
```

## Rodar a atualização completa

No GitHub:

```text
Actions > Atualizar ações > Run workflow
```

Usar:

```text
modo: completo_com_itr
sleep: 1
anos_dfp: 2024 2023 2022 2021
anos_itr: 2025 2024
```

## Arquivos sensíveis

Não subir `.env`, `.env.local`, `.next`, `.venv`, `node_modules` ou chaves reais.


## Versão atual

v1.53.4 — fallback de cotação pelo histórico quando `asset_quotes` não retorna cotação direta.
