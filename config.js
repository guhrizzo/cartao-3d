// ============================================================
//  AJUSTE AQUI: textos, contatos e cores da página.
//  Não mexa no resto se não precisar.
// ============================================================
export const CONFIG = {
  // Nome que aparece no topo e no cartão (troque pelo seu ou do cliente)
  marca: "SeuNome",
  nomeNoCartao: "NOME DO CLIENTE",
  ultimosDigitos: "1234",

  // Contatos dos botões (só números no WhatsApp, com DDI+DDD)
  whatsapp: "5500000000000",
  instagram: "seuinstagram",

  titulo: "Será que o seu site também chamaria tanta atenção?",
  subtitulo:
    "Este cartão é 3D, gira com o mouse e troca de cor. Eu faço sites assim para o seu negócio ficar impossível de ignorar.",

  // Cores do cartão: id, nome do botão, cor do corpo, cor do texto e brilho do fundo
  temas: [
    { id: "black",        nome: "Black",        cor: "#0B0B0F", texto: "#FFFFFF", brilho: "#4a4a5a" },
    { id: "roxo-escuro",  nome: "Roxo escuro",  cor: "#3A0F6B", texto: "#FFFFFF", brilho: "#6d2bd1" },
    { id: "roxo-claro",   nome: "Roxo claro",   cor: "#A97BFF", texto: "#1B0A33", brilho: "#c9a8ff" },
  ],
  trocaAutomaticaMs: 3200,

  // Modelo 3D (GLB). Se não carregar, a página usa um cartão desenhado em código.
  modelo: "assets/cartao.glb",

  beneficios: [
    { t: "Visual que prende", d: "Animações e 3D que fazem a pessoa parar de rolar o feed e olhar." },
    { t: "Rápido no celular", d: "Leve, responsivo e pensado para quem chega pelo Instagram." },
    { t: "Do seu jeito", d: "Suas cores, seu texto, seu contato. Pronto para virar cliente." },
  ],
};
