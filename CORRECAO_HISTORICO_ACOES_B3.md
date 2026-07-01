# Correção v1.53.16 - Histórico completo de ações da B3

Esta versão ajusta a consolidação para preparar a atualização de todas as ações da B3 antes da etapa de FIIs.

## O que muda

- O workflow `Atualizar ações` agora vem por padrão em `completo_com_itr`.
- O universo padrão passa a ser `todas_acoes_b3`.
- Os anos DFP padrão passam a ser os últimos 5 exercícios encerrados.
- Os anos ITR padrão passam a ser o ano atual e o ano anterior.
- A tabela anual de indicadores deixa de misturar a linha atual/parcial com os anos fechados.
- Dividend Yield e dividendo por ação passam a ser calculados por ano com base nos proventos daquele ano, quando a base trouxer os eventos.
- A consolidação prioriza dados CVM/base própria sobre demonstrativos do Yahoo quando houver duplicidade no mesmo ano.
- O Balanço, DRE e Fluxo de Caixa passam a preencher contas deriváveis quando a fonte não trouxer a linha sintética, como ativo não circulante, custo, despesas operacionais, fluxo livre e variação de caixa.

## Como rodar no GitHub Actions

Use:

- O que atualizar: `completo_com_itr`
- Anos DFP: `2025 2024 2023 2022 2021`
- Anos ITR: `2026 2025`
- Universo de ações: `todas_acoes_b3`
- Publicar snapshot: `sim`

Após concluir, rode `git pull` localmente e reinicie o servidor.
