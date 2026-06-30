# Foco Invest v1.53.3

Correção da instabilidade no download da CVM pelo GitHub Actions.

## Ajuste principal

- Mantido retry da CVM.
- Adicionado `CVM_FORCE_IPV4=1` por padrão.
- O script `scripts/update_cvm_companies.py` agora força IPv4 nos downloads da CVM para evitar o erro `Errno 101: Network is unreachable` em runners do GitHub Actions.

## Próximo teste recomendado

Rodar no GitHub Actions:

```text
modo: completo_com_itr
sleep: 1
anos_dfp: 2024 2023 2022 2021
anos_itr: 2025 2024
```

Se passar, validar a base e páginas principais.
