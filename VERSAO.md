# Versão atual

v1.53.22 — Publicação segura de snapshots no GitHub Actions.

# Foco Invest - v1.53.18

Correção de match CVM para NTCO3/WIZC3 e publicação segura do snapshot.

- NTCO3 passa a ter hints de match com NATURA/NATURA &CO.
- WIZC3 mantém compatibilidade de busca e passa a entrar na validação do snapshot.
- Snapshot só é publicado quando a validação passa, evitando snapshot parcial.
- Validação mínima inclui PETR3, PETR4, ABEV3, LREN3, RENT3, CMIG4, SUZB3, WEGE3, MGLU3, NTCO3 e WIZC3.


## v1.53.19

- Corrige roteamento/busca entre ações e FIIs.
- Cria página própria para `/fiis/[ticker]`.
- Complementa FIIs via rotina Python `update_fii_fundamentus.py`.
- Ajusta workflows para publicar snapshot em atualização manual e agendada.
- Atualiza cache para `v15319`.


## v1.53.21

- Corrige falha do workflow quando a CVM fica indisponível por timeout.
- `completo_sem_itr` e `completo_com_itr` agora continuam a rotina se a CVM falhar temporariamente.
- Snapshot pode ser publicado com dados existentes + preços/proventos atualizados, sem travar toda a atualização.
- Modo `cvm` isolado continua funcionando como teste rígido da CVM.


## v1.53.22

- Corrige erro de `git push` recusado nos workflows quando outro workflow ou commit atualiza a branch `main` antes da publicação do snapshot.
- Adiciona fila/concurrency entre workflows que publicam snapshot, evitando corrida entre atualização de ações e FIIs.
- Publicação do snapshot agora faz `fetch`, `reset` para `origin/main`, reaplica o snapshot gerado e tenta o `push` até 3 vezes.
- Ajuste aplicado em `Atualizar ações`, `Atualizar FIIs` e `Recriar snapshot de ações`.
