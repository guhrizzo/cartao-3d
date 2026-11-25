# Cartão 3D

Página com um cartão 3D interativo (Three.js) que gira com o mouse e troca de cor entre Black, Roxo escuro e Roxo claro. Feita para divulgar criação de sites.

## Como ajustar

Tudo que você vai querer mexer está em `config.js`: nome, WhatsApp, Instagram, textos e as cores do cartão.

## Rodar no computador

Os módulos JS não abrem direto do arquivo (`file://`), então use um servidor local.

**Entre primeiro na pasta do projeto.** O servidor mostra tudo que estiver na pasta onde ele foi iniciado, e `--bind 127.0.0.1` impede que outros aparelhos da rede acessem:

```powershell
cd D:\cartao-3d
python -m http.server 8123 --bind 127.0.0.1
```

Depois abra http://localhost:8123 (deve aparecer a página, não uma lista de arquivos). Para parar, use Ctrl+C.

## Publicar (GitHub Pages)

No repositório: Settings → Pages → Branch `main` / pasta `/ (root)`. O Pages grátis exige repositório público.

## Observação

O cartão usa um nome genérico, sem marca nem logotipo de terceiros. Se for mostrar a um cliente, troque `marca` e `nomeNoCartao` em `config.js` pelo nome dele, com autorização.
