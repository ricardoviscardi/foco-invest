# Foco Invest v1.53.2

## Correção desta versão

- Mantida a correção da v1.53.1 para a função `choose_frame` na etapa CVM.
- Corrigida a rotina de download da CVM para lidar melhor com falhas temporárias de rede no GitHub Actions, como:
  - `Network is unreachable`
  - `Max retries exceeded`
  - falha temporária ao acessar `dados.cvm.gov.br`
- Adicionadas novas tentativas automáticas antes de considerar a etapa CVM como falha.
- O script agora imprime avisos de retry no log, facilitando identificar quando a CVM ou a rede do runner estiver instável.

## Por que foi necessário

O modo `cvm` passou, mas o modo `completo_com_itr` falhou depois, quando o GitHub Actions tentou acessar o endereço público da CVM e recebeu erro temporário de rede.

Isso não era mais o erro anterior de código. A falha ocorreu no acesso externo à CVM.

## Como validar

Depois de subir esta versão para o GitHub, rode novamente:

```text
Actions > Atualizar ações > Run workflow
```

Use:

```text
modo: completo_com_itr
sleep: 1
anos_dfp: 2024 2023 2022 2021
anos_itr: 2025 2024
```

Se ainda falhar com `Network is unreachable`, aguarde alguns minutos e rode novamente, pois nesse caso será indisponibilidade externa temporária da CVM/GitHub runner.
