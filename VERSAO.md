# Versão

## v1.53.17 — Ações, busca e início da atualização de FIIs

- A tela `/acoes` lista 40 ações de referência/maior negociação.
- A tela `/fiis` lista 30 FIIs de referência/maior negociação.
- Busca de ticker consulta fallback, snapshot local, Supabase e BRAPI.
- Busca por `wizc` passa a encontrar/abrir `WIZC3`.
- Snapshot exporta ações e FIIs no mesmo índice.
- Criado workflow `Atualizar FIIs`.
- Indicadores-chave usam o primeiro valor útil disponível na base histórica quando o registro mais recente estiver incompleto.
- Tabelas fundamentalistas ocultam linhas 100% vazias para reduzir ruído visual.

## v1.53.16 — Ações B3 histórico completo

- Ligação de dados históricos de ações via snapshot local/remoto.
- Atualização ampla de ações da B3 antes da etapa de FIIs.
