# v1.53.17 — Ações, busca e início da atualização de FIIs

## Ajustes entregues

1. A tela `/acoes` agora exibe 40 ações de referência/maior negociação, em vez da lista curta anterior.
2. A tela `/fiis` agora exibe 30 fundos imobiliários de referência/maior negociação.
3. A busca passa a consultar também o snapshot local publicado pelo GitHub Actions, reduzindo dependência do Supabase local.
4. A busca por tickers digitados sem número final, como `wizc`, passa a sugerir/abrir `WIZC3` quando existir correspondência.
5. A rotina de snapshot foi ampliada para exportar ações e FIIs no mesmo índice, evitando que uma atualização sobrescreva a lista da outra.
6. Criado workflow `Atualizar FIIs` para atualizar preços, histórico, dividendos e snapshot dos FIIs.
7. Os indicadores-chave agora tentam usar o primeiro valor útil disponível na base histórica quando o registro mais recente estiver incompleto.
8. Tabelas fundamentalistas deixam de exibir linhas 100% vazias quando a fonte não trouxe aquela conta.

## Observação sobre dados ausentes

Algumas linhas de Balanço, DRE ou Fluxo de Caixa podem continuar vazias quando a fonte pública não fornece aquela conta de forma padronizada para o ativo. A versão evita exibir linhas totalmente vazias e prioriza dados próprios/CVM/snapshot antes de complementos públicos.

## Próximo passo operacional

1. Fazer commit e push da versão.
2. Rodar `Atualizar ações` com `todas_acoes_b3` e snapshot `sim`.
3. Depois rodar `Atualizar FIIs` com snapshot `sim`.
4. Fazer `git pull` local e testar `/acoes`, `/fiis`, `/acoes/wizc3`, `/acoes/abev3`, `/acoes/wege3`, `/acoes/mglu3`.
