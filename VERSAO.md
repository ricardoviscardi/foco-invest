# Versão atual

v1.53.20 — Redução de dados indisponíveis em ações e FIIs.

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
