# v1.53.21 - Correção de timeout da CVM no GitHub Actions

## Problema
A etapa de preços atualizou 319 tickers, mas a execução quebrou na etapa CVM porque o runner do GitHub não conseguiu acessar `dados.cvm.gov.br`, mesmo após 8 tentativas.

Erro observado:

```text
ConnectTimeoutError / Connection to dados.cvm.gov.br timed out
Não foi possível acessar a CVM após 8 tentativas
```

## Correção
A atualização completa agora trata a etapa CVM como tolerante a falha temporária quando o modo escolhido é `completo_sem_itr` ou `completo_com_itr`.

Isso significa:

1. A etapa de preços continua atualizando ações normalmente.
2. Se a CVM estiver fora/instável, a rotina não derruba tudo.
3. O workflow continua para `check_supabase_data.py`.
4. O workflow exporta/publica snapshot usando os dados já existentes no Supabase mais os preços e proventos atualizados.
5. O modo `cvm` isolado continua falhando quando a CVM estiver fora, porque nesse modo o objetivo é especificamente testar/rodar a CVM.

## Como usar
Rode novamente:

```text
Actions > Atualizar ações > Run workflow
```

Com:

```text
O que atualizar: completo_com_itr
Anos DFP: 2025 2024 2023 2022 2021
Anos ITR: 2026 2025
Universo de ações: todas_acoes_b3
Publicar snapshot: sim
```

Se a CVM cair novamente, o workflow deve seguir adiante e publicar snapshot com a base disponível.

Quando quiser tentar enriquecer os demonstrativos CVM depois, rode separadamente:

```text
Actions > Atualizar ações > Run workflow
O que atualizar: cvm
```

