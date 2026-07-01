# v1.53.13 — Correção de escala e saneamento dos históricos

## Objetivo

Corrigir a exibição dos dados históricos carregados por snapshot local/remoto.

## Ajustes

- Corrigido saneamento de escala em demonstrativos antigos da CVM.
- Evita valores absurdos como “R$ 203.645.900 tri” em Balanço, DRE e Fluxo de Caixa.
- Recalcula/valida indicadores anuais quando registros antigos vêm zerados ou fora de faixa.
- Mantém anos anteriores nos cards de Indicadores, Balanço Patrimonial, DRE e Fluxo de Caixa.
- Bumped cache para v15313.
- Mantido snapshot como caminho principal para teste local quando Supabase estiver bloqueado.
