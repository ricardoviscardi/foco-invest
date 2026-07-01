# Foco Invest — v1.53.10

Versão com snapshot local de ações para testar a base completa em redes que bloqueiam o Supabase.

# Foco Invest — v1.53.9

Versão: v1.53.9 — saneamento estrutural da ligação de dados das páginas de ações

## Ajustes desta versão

- Troca a leitura server-side do Supabase para `node:https`, com IPv4 forçado por padrão, para reduzir falhas locais de SSL/rede após bloqueios corporativos/VPN.
- Mantém `LOCAL_PROXY_INSECURE_TLS=true` apenas em desenvolvimento, quando necessário.
- Aumenta a busca de `asset_financials`, `asset_indicators` e `asset_dividends` para evitar cortes de dados.
- Reconstrói indicadores anuais a partir dos demonstrativos CVM quando `asset_indicators` vier incompleto.
- Reordena as colunas da análise fundamentalista por anos realmente disponíveis, em vez de depender só do ano atual.
- Faz merge célula a célula entre Supabase e complemento público, sem substituir uma tabela anual rica por uma tabela de apenas “Atual”.
- Normaliza a cotação do dia no final do fluxo: último fechamento, fechamento anterior, variação, volume e valor de mercado passam a usar o mesmo preço do cabeçalho.
- Reforça o saneamento de Dividend Yield para impedir percentuais incompatíveis.
- Atualiza o cache interno para `v1539`.

## Como validar

1. Limpar `.next`.
2. Rodar `npm run dev`.
3. Abrir `/api/data/status` e confirmar `connected: true`.
4. Abrir `/api/data/asset/lren3` e conferir se `found: true`.
5. Testar `/acoes/lren3`, `/acoes/rail3`, `/acoes/petr3`, `/acoes/petr4`, `/acoes/pomo4` e `/rankings`.

## Próximo passo

Se `/api/data/status` estiver conectado e as páginas mostrarem análise fundamentalista anual/trimestral, fazer commit e push. Depois seguir para v1.54 — FIIs oficiais + revisão final para deploy na Vercel.


## v1.53.9

Saneamento dos demonstrativos históricos, correção do modo CVM --all e opção de atualizar universo amplo de ações da B3 antes da etapa de FIIs.
