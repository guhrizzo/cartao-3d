# Prompt para a página do Nubank

Crie uma página conceitual de apresentação do Nubank, sua conta, Pix, Caixinhas e cartão, em português brasileiro. Crie uma direção editorial própria com fundo ameixa escuro, lilás luminoso, uma seção de benefícios clara e tipografia Manrope. Identifique a página como projeto conceitual independente e encaminhe a ação comercial para a página oficial do Nubank.

## Composição

- Abra com o título “Seu dinheiro. Do seu jeito.” e uma descrição breve. Coloque o cartão flutuante à direita no desktop e após o texto no celular.
- Use o Higgsfield com GPT Image 2 para gerar um fundo horizontal 16:9. Peça uma faixa translúcida de luz violeta que emerge do canto inferior direito em um estúdio escuro, com espaço negativo à esquerda e área reservada para o cartão no centro-direita. A imagem deve conter apenas luz, textura e fundo. Exporte em WebP e exiba um gradiente CSS durante a carga ou em caso de falha.
- Apresente a conta, o Pix, as Caixinhas e o cartão em uma grade editorial. Antes do FAQ, insira “O Nubank no dia a dia” com três etapas em rolagem horizontal, imagens oficiais do Nubank com parallax e fade nas laterais da trilha. Fixe a seção durante a rolagem vertical no desktop e use deslize lateral em telas menores. Feche com a ação “Conhecer mais”.

## Interação e carregamento

- Reaproveite o arquivo `assets/cartao.glb`, o carregador GLTF, o shader de recoloração e o cartão procedural do projeto. Em Three.js, permita girar o cartão por arraste ou pelo teclado. Use o acabamento fixo Ameixa (`#442266`).
- Reaplique o padrão do Famiglia Mancini com GSAP ScrollSmoother e ScrollTrigger. Use `smooth: 1.1`, `smoothTouch: false` e `effects: false`, com cabeçalho fixo fora do wrapper. Faça os links internos atualizarem o hash e o foco e descontarem a altura do cabeçalho. Revele suavemente os textos de cada seção ao atingir `top 92%`, junto com o parallax das fotografias e use o progresso da primeira dobra para uma inclinação sutil do cartão.
- Mostre um preloader cinematográfico a cada carregamento, com luz violeta em movimento e porcentagem abaixo da barra. Faça o progresso levar pelo menos dois segundos para chegar a 100% enquanto aguarda a cena 3D, o fundo, as fontes e o carregamento da página. Segure os 100% por aproximadamente 620 ms e inicie a entrada do hero durante o fade. Libere a interface após até sete segundos, inclusive se algum recurso falhar. Use rolagem nativa e desative animações automáticas quando houver preferência por movimento reduzido. Em navegadores sem WebGL, apresente uma ilustração estática.
- Mantenha as configurações do cartão em `config.js`. Use Vite com os pacotes locais. Rode `npm run build`, verifique desktop, celular e movimento reduzido e deixe `npm run dev` ativo em `http://127.0.0.1:8123`.
