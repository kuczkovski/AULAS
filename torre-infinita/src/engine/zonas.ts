/** Identidade de cada zona da torre: cor, descrição e o chefe que a guarda. */
export interface InfoZona {
  cor: string;
  descricao: string;
  chefe: {
    nome: string;
    /** Fala de abertura, antes da luta. */
    fala: string;
    /** Fala quando o aluno vence. */
    derrota: string;
    /** Fala quando o aluno perde as vidas. */
    vitoria: string;
  };
}

export const ZONAS: Record<string, InfoZona> = {
  "Fundação": {
    cor: "#5b3df5",
    descricao: "Contas, tabuada e as regras que sustentam todo o resto.",
    chefe: { nome: "Golem das Contas", fala: "Ninguém passa por mim sem saber a tabuada!", derrota: "Rachei todo! Você domina a base da torre.", vitoria: "Volte quando a tabuada estiver mais firme." },
  },
  "Números": {
    cor: "#0d8fd1",
    descricao: "Múltiplos, divisores e números decimais.",
    chefe: { nome: "Mago dos Múltiplos", fala: "Divisores, múltiplos, decimais... prove que entende!", derrota: "Sua magia numérica é forte. Passe!", vitoria: "Meus feitiços ainda são maiores que os seus. Treine e volte." },
  },
  "Frações": {
    cor: "#e5487a",
    descricao: "Partes de um inteiro: equivalentes, comparação e reta numérica.",
    chefe: { nome: "Dragão Fatiador", fala: "Eu corto tudo em pedaços iguais. E você, sabe cortar?", derrota: "Você fatiou o dragão em partes iguais!", vitoria: "Ainda sobraram pedaços... Treine as frações e volte." },
  },
  "Inteiros": {
    cor: "#475569",
    descricao: "Números negativos, oposto e a reta numérica inteira.",
    chefe: { nome: "Sombra Negativa", fala: "Aqui embaixo do zero, tudo é ao contrário...", derrota: "Você trouxe luz para o lado negativo.", vitoria: "Menos com menos... você ainda se enrola. Volte!" },
  },
  "Proporção": {
    cor: "#d97706",
    descricao: "Porcentagem, razão e regra de três.",
    chefe: { nome: "Gigante da Escala", fala: "Se eu sou enorme, você é proporcionalmente...?", derrota: "Proporção perfeita! Você me reduziu ao tamanho certo.", vitoria: "Sua conta saiu fora de escala. Tente de novo!" },
  },
  "Álgebra": {
    cor: "#0f9d8a",
    descricao: "Equações, expressões e a caça ao valor de x.",
    chefe: { nome: "Esfinge do X", fala: "Decifre o x ou não passa!", derrota: "Você decifrou meu enigma. O x era seu!", vitoria: "O enigma continua sem resposta. Volte a tentar." },
  },
  "Potências": {
    cor: "#e2571b",
    descricao: "Expoentes, raízes e notação científica.",
    chefe: { nome: "Hidra dos Expoentes", fala: "Corte uma cabeça e nascem duas!", derrota: "Todas as cabeças caíram. Expoente domado!", vitoria: "Nasceram mais cabeças... revise os expoentes." },
  },
  "Geometria": {
    cor: "#16a34a",
    descricao: "Triângulos retângulos e o teorema de Pitágoras.",
    chefe: { nome: "Arquiteta dos Triângulos", fala: "Meus triângulos são retos. Suas respostas serão?", derrota: "Projeto aprovado! Você entende de catetos e hipotenusas.", vitoria: "A estrutura desabou. Revise Pitágoras e volte." },
  },
  "Dados": {
    cor: "#a21caf",
    descricao: "Média, mediana e moda.",
    chefe: { nome: "Oráculo dos Dados", fala: "Eu vejo o futuro... pela média.", derrota: "Você leu os dados melhor que eu.", vitoria: "Os números não mentem: mais treino, e volte." },
  },
  "Problemas": {
    cor: "#b45309",
    descricao: "Problemas do dia a dia: compras, grupos e troco.",
    chefe: { nome: "Mercador Trapaceiro", fala: "Troco errado é comigo! Confira as contas.", derrota: "Você não caiu na minha conversa. Troco certinho!", vitoria: "Levei um trocado a mais... Confira melhor!" },
  },
};

export const infoZona = (zona: string): InfoZona => ZONAS[zona] ?? ZONAS["Fundação"]!;
