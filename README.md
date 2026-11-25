# Cartão 3D

Página com um cartão 3D interativo (Three.js) que gira com o mouse e troca de cor entre Black, Roxo escuro e Roxo claro. Feita para divulgar criação de sites.

## Como ajustar

Tudo que você vai querer mexer está em `config.js`: nome, WhatsApp, Instagram, textos e as cores do cartão.

## Rodar no computador

Os módulos JS não abrem direto do arquivo (`file://`), então use um servidor local:

```powershell
python -m http.server 8123
```

Depois abra http://localhost:8123

## Publicar (GitHub Pages)

No repositório: Settings → Pages → Branch `main` / pasta `/ (root)`. O Pages grátis exige repositório público.

## Observação

O cartão usa um nome genérico, sem marca nem logotipo de terceiros. Se for mostrar a um cliente, troque `marca` e `nomeNoCartao` em `config.js` pelo nome dele, com autorização.
