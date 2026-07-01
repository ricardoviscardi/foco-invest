# v1.53.20 — Redução de dados indisponíveis em ações e FIIs

## Ajustes

- Reforçado o complemento automático quando o snapshot local vem com dados parciais.
- FIIs passam a tentar complemento em tempo de execução com fontes públicas antes de exibir campos vazios.
- NTCO3 passa sempre por tentativa de complemento externo, mesmo quando existe um registro parcial no snapshot.
- Indicadores-chave vazios agora tentam usar valores já presentes na tabela de análise fundamentalista.
- Linhas e colunas 100% vazias deixam de ser exibidas na análise fundamentalista.
- Dividendos 12m podem ser recalculados pelos eventos de proventos quando o resumo vier vazio.
- Cache atualizado para v15320.

## Observação

Nenhum dado é inventado. Quando a fonte não oferece uma métrica histórica específica, a página evita poluir a interface com linhas totalmente vazias e usa o melhor complemento disponível.
