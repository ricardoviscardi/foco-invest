# Versão atual

v1.53.12 — Snapshot remoto para ações da B3 e saneamento de dados locais

## Observação

Antes de avançar para FIIs, validar ações com `completo_com_itr`, `universo=todas_acoes_b3` e `publicar_snapshot=sim`.


## v1.53.12 — Snapshot obrigatório para dados históricos locais

Correção do fluxo de dados para redes que bloqueiam o Supabase: adiciona workflow independente para recriar/publicar snapshot, valida cobertura mínima de demonstrativos e melhora o diagnóstico quando a página estiver usando apenas dados públicos parciais.
