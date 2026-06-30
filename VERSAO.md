# Foco Invest — v1.53.4

Versão: v1.53.4 — fallback de cotação pelo histórico

## Ajustes desta versão

- Corrige exibição de "Cotação atual não disponível" quando há histórico de preços no banco.
- Usa o último fechamento histórico como fallback para cotação atual.
- Usa o penúltimo fechamento histórico para calcular variação diária quando a cotação direta não estiver disponível.
- Mantém a correção anterior de IPv4/retry para downloads da CVM no GitHub Actions.

## Próximo passo

Validar páginas de ações localmente e avançar para v1.54 — FIIs oficiais + preparação para deploy.
