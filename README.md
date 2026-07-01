# Foco Invest — v1.53.10

Versão com snapshot local de ações para testar a base completa em redes que bloqueiam o Supabase.

# Foco Invest

Projeto Next.js + TypeScript + Tailwind para consulta pública de ações brasileiras, fundamentos, indicadores, proventos e rankings.

## Versão atual

**v1.53.9 — saneamento estrutural da ligação de dados das páginas de ações**

Esta versão corrige a ligação entre a página de ações e a base consolidada no Supabase, principalmente depois da migração das atualizações para GitHub Actions e dos problemas locais de rede/VPN.

## Principais correções

```text
1. Leitura server-side do Supabase via node:https com IPv4 forçado.
2. Melhor tolerância a SSL/rede local em desenvolvimento.
3. Reforço na busca de demonstrativos, indicadores e dividendos.
4. Reconstrução de indicadores anuais a partir dos demonstrativos CVM.
5. Análise fundamentalista com anos efetivamente disponíveis.
6. Merge célula a célula entre base consolidada e complemento público.
7. Cotação do dia coerente com a cotação do cabeçalho.
8. Dividend Yield saneado para evitar percentuais incompatíveis.
```

## Rodar localmente

```powershell
cd C:\Users\38405395873\Documents\Web\foco-invest
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run dev
```

## Validação

Abra:

```text
http://localhost:3000/api/data/status
http://localhost:3000/api/data/asset/lren3
http://localhost:3000/acoes/lren3
http://localhost:3000/acoes/rail3
http://localhost:3000/acoes/petr3
http://localhost:3000/acoes/petr4
http://localhost:3000/acoes/pomo4
http://localhost:3000/rankings
```

O endpoint `/api/data/status` precisa mostrar conexão com o Supabase. Se não conectar, a página ainda vai usar complemento público, mas os dados CVM históricos/anuais não ficarão completos.

## GitHub Actions

Para atualizar a base:

```text
Actions > Atualizar ações > Run workflow
```

Usar:

```text
modo: completo_com_itr
universo: todas_acoes_b3
sleep: 1
anos_dfp: 2024 2023 2022 2021
anos_itr: 2025 2024
```

## Arquivos sensíveis

Não subir `.env`, `.env.local`, `.next`, `.venv`, `node_modules` ou chaves reais.


## v1.53.9

Saneamento dos demonstrativos históricos, correção do modo CVM --all e opção de atualizar universo amplo de ações da B3 antes da etapa de FIIs.


## v1.53.11

Correção do fluxo de dados em rede local bloqueada: Supabase > snapshot local > snapshot remoto > complemento parcial. O workflow pode publicar snapshots no repositório para exibir análise fundamentalista, balanço, DRE, fluxo de caixa e dividendos mesmo quando o Supabase estiver bloqueado localmente.
