# Foco Invest v1.53.1

## Correção desta versão

- Corrigido erro da GitHub Action na etapa CVM:
  - `NameError: name 'choose_frame' is not defined`.
- Adicionada função `choose_frame` em `scripts/update_cvm_companies.py` para localizar corretamente os quadros BPA, BPP, DRE e DFC dentro dos ZIPs da CVM.
- Adicionadas funções de compatibilidade usadas por `rows_from_zip`:
  - `normalize_cvm_code`
  - `references`
  - `value_for`
  - `quarter_label`
- Ajustado o modo `cvm` do workflow `Atualizar ações` para também respeitar o campo `anos_itr`.

## Objetivo

Permitir que a GitHub Action conclua a importação de cadastro e fundamentos CVM sem quebrar na função ausente.

## Como validar

Depois de subir esta versão para o GitHub, rode:

```text
Actions > Atualizar ações > Run workflow
```

Sugestão inicial:

```text
modo: cvm
anos_dfp: 2024 2023 2022 2021
anos_itr: 2025 2024
```

Se passar, rode depois:

```text
modo: completo_com_itr
sleep: 1
anos_dfp: 2024 2023 2022 2021
anos_itr: 2025 2024
```
