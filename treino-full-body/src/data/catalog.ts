import type {
  Equipment,
  Exercise,
  MuscleGroup,
  RepUnit,
  TemplateItem,
  WorkoutTemplate,
} from "@/lib/types";

// Catálogo inicial. Nenhuma carga é pré-definida: o usuário registra a
// própria carga na primeira sessão. IDs são estáveis para que a
// sincronização entre dispositivos não duplique registros.

interface Def {
  id: string;
  name: string;
  group: MuscleGroup;
  secondary?: MuscleGroup[];
  equipment: Equipment;
  sets?: number;
  range: [number, number];
  rest: number;
  rir?: number | null;
  unit?: RepUnit;
  cues: string[];
  alts?: string[];
}

const DEFS: Def[] = [
  // Peitoral
  {
    id: "supino-reto-barra", name: "Supino reto com barra", group: "peitoral", secondary: ["triceps", "ombros"],
    equipment: "barra", sets: 4, range: [6, 8], rest: 150, rir: 2,
    cues: ["Escápulas aproximadas e apoiadas no banco", "Pés firmes no chão", "Barra desce controlada até a linha do peito", "Punhos alinhados sobre os cotovelos"],
    alts: ["supino-reto-halteres", "supino-maquina", "flexao-bracos"],
  },
  {
    id: "supino-reto-halteres", name: "Supino reto com halteres", group: "peitoral", secondary: ["triceps", "ombros"],
    equipment: "halteres", range: [8, 12], rest: 120, rir: 2,
    cues: ["Halteres descem na linha do peito", "Cotovelos a cerca de 45° do tronco", "Controle a descida"],
    alts: ["supino-reto-barra", "supino-maquina"],
  },
  {
    id: "supino-maquina", name: "Supino na máquina", group: "peitoral", secondary: ["triceps", "ombros"],
    equipment: "maquina", range: [8, 12], rest: 90, rir: 1,
    cues: ["Ajuste o banco para as pegadas ficarem na linha do peito", "Escápulas apoiadas", "Estenda sem travar os cotovelos"],
    alts: ["supino-reto-halteres", "flexao-bracos"],
  },
  {
    id: "flexao-bracos", name: "Flexão de braços", group: "peitoral", secondary: ["triceps", "abdomen"],
    equipment: "peso_corporal", range: [8, 15], rest: 90, rir: 2,
    cues: ["Corpo alinhado da cabeça aos calcanhares", "Abdômen e glúteos contraídos", "Peito se aproxima do chão"],
    alts: ["supino-maquina", "supino-reto-halteres"],
  },
  {
    id: "supino-inclinado-halteres", name: "Supino inclinado com halteres", group: "peitoral", secondary: ["ombros", "triceps"],
    equipment: "halteres", sets: 3, range: [8, 12], rest: 90, rir: 1,
    cues: ["Banco entre 30° e 45°", "Halteres descem na linha da parte alta do peito", "Sem arquear excessivamente a lombar"],
    alts: ["supino-inclinado-barra", "supino-inclinado-maquina"],
  },
  {
    id: "supino-inclinado-barra", name: "Supino inclinado com barra", group: "peitoral", secondary: ["ombros", "triceps"],
    equipment: "barra", sets: 4, range: [6, 10], rest: 120, rir: 2,
    cues: ["Banco entre 30° e 45°", "Barra toca a parte alta do peito", "Escápulas estáveis"],
    alts: ["supino-inclinado-halteres", "supino-inclinado-maquina"],
  },
  {
    id: "supino-inclinado-maquina", name: "Supino inclinado na máquina", group: "peitoral", secondary: ["ombros", "triceps"],
    equipment: "maquina", range: [8, 12], rest: 90, rir: 1,
    cues: ["Ajuste o assento para a pegada na altura da parte alta do peito", "Movimento contínuo e controlado"],
    alts: ["supino-inclinado-halteres", "supino-inclinado-barra"],
  },
  {
    id: "crucifixo-maquina", name: "Crucifixo na máquina (peck deck)", group: "peitoral",
    equipment: "maquina", sets: 3, range: [10, 15], rest: 75, rir: 1,
    cues: ["Cotovelos levemente flexionados e fixos", "Aproxime as mãos contraindo o peitoral", "Retorne devagar até sentir alongamento confortável"],
    alts: ["crucifixo-halteres", "crossover-polia"],
  },
  {
    id: "crucifixo-halteres", name: "Crucifixo com halteres", group: "peitoral",
    equipment: "halteres", range: [10, 15], rest: 75, rir: 2,
    cues: ["Amplitude confortável para os ombros", "Cotovelos levemente flexionados", "Controle a descida"],
    alts: ["crucifixo-maquina", "crossover-polia"],
  },
  {
    id: "crossover-polia", name: "Crossover na polia", group: "peitoral",
    equipment: "polia", range: [10, 15], rest: 75, rir: 1,
    cues: ["Tronco levemente inclinado à frente", "Mãos se encontram à frente do peito", "Retorno controlado"],
    alts: ["crucifixo-maquina", "crucifixo-halteres"],
  },

  // Costas
  {
    id: "remada-curvada-barra", name: "Remada curvada com barra", group: "costas", secondary: ["biceps", "posteriores"],
    equipment: "barra", sets: 4, range: [6, 10], rest: 120, rir: 2,
    cues: ["Quadril para trás, coluna neutra", "Puxe a barra em direção ao umbigo", "Evite dar impulso com o tronco"],
    alts: ["remada-apoiada-maquina", "remada-unilateral-halter", "remada-baixa-polia"],
  },
  {
    id: "remada-apoiada-maquina", name: "Remada com apoio no peito", group: "costas", secondary: ["biceps"],
    equipment: "maquina", range: [8, 12], rest: 90, rir: 1,
    cues: ["Peito apoiado durante todo o movimento", "Leve os cotovelos para trás", "Pausa breve na contração"],
    alts: ["remada-curvada-barra", "remada-baixa-polia"],
  },
  {
    id: "remada-unilateral-halter", name: "Remada unilateral com halter", group: "costas", secondary: ["biceps"],
    equipment: "halteres", sets: 3, range: [8, 12], rest: 90, rir: 1,
    cues: ["Apoie mão e joelho no banco", "Puxe o halter em direção ao quadril", "Evite girar o tronco"],
    alts: ["remada-apoiada-maquina", "remada-baixa-polia"],
  },
  {
    id: "remada-baixa-polia", name: "Remada baixa na polia", group: "costas", secondary: ["biceps"],
    equipment: "polia", sets: 2, range: [10, 12], rest: 90, rir: 1,
    cues: ["Tronco estável, sem balançar", "Puxe o triângulo até o abdômen", "Estenda os braços com controle"],
    alts: ["remada-apoiada-maquina", "remada-unilateral-halter"],
  },
  {
    id: "puxada-frontal", name: "Puxada frontal", group: "costas", secondary: ["biceps"],
    equipment: "polia", sets: 3, range: [8, 12], rest: 90, rir: 1,
    cues: ["Pegada um pouco mais larga que os ombros", "Puxe a barra até a parte alta do peito", "Deprima as escápulas antes de flexionar os cotovelos"],
    alts: ["barra-fixa", "puxada-supinada", "barra-fixa-assistida"],
  },
  {
    id: "barra-fixa", name: "Barra fixa", group: "costas", secondary: ["biceps", "abdomen"],
    equipment: "peso_corporal", sets: 4, range: [5, 8], rest: 150, rir: 2,
    cues: ["Comece com braços estendidos e ombros ativos", "Queixo acima da barra", "Descida controlada"],
    alts: ["barra-fixa-assistida", "puxada-frontal"],
  },
  {
    id: "barra-fixa-assistida", name: "Barra fixa assistida", group: "costas", secondary: ["biceps"],
    equipment: "maquina", range: [6, 10], rest: 120, rir: 2,
    cues: ["Registre a carga de assistência utilizada", "Mesma técnica da barra fixa"],
    alts: ["barra-fixa", "puxada-frontal"],
  },
  {
    id: "puxada-supinada", name: "Puxada supinada", group: "costas", secondary: ["biceps"],
    equipment: "polia", sets: 2, range: [8, 12], rest: 90, rir: 1,
    cues: ["Pegada supinada na largura dos ombros", "Cotovelos descem próximos ao tronco"],
    alts: ["puxada-frontal", "barra-fixa-assistida"],
  },

  // Ombros
  {
    id: "desenvolvimento-halteres", name: "Desenvolvimento com halteres sentado", group: "ombros", secondary: ["triceps"],
    equipment: "halteres", sets: 3, range: [8, 10], rest: 120, rir: 2,
    cues: ["Encosto levemente inclinado", "Halteres sobem sem bater no topo", "Costelas para baixo, sem hiperextensão lombar"],
    alts: ["desenvolvimento-maquina", "desenvolvimento-barra"],
  },
  {
    id: "desenvolvimento-barra", name: "Desenvolvimento militar com barra", group: "ombros", secondary: ["triceps", "abdomen"],
    equipment: "barra", sets: 4, range: [6, 8], rest: 150, rir: 2,
    cues: ["Em pé, glúteos e abdômen contraídos", "Barra passa próxima ao rosto", "Cabeça avança levemente ao final"],
    alts: ["desenvolvimento-halteres", "desenvolvimento-maquina"],
  },
  {
    id: "desenvolvimento-maquina", name: "Desenvolvimento na máquina", group: "ombros", secondary: ["triceps"],
    equipment: "maquina", range: [8, 12], rest: 90, rir: 1,
    cues: ["Ajuste o assento com as pegadas na altura dos ombros", "Estenda sem travar os cotovelos"],
    alts: ["desenvolvimento-halteres", "desenvolvimento-barra"],
  },
  {
    id: "elevacao-lateral-halteres", name: "Elevação lateral com halteres", group: "ombros",
    equipment: "halteres", sets: 2, range: [12, 15], rest: 60, rir: 1,
    cues: ["Eleve até a altura dos ombros", "Cotovelos levemente flexionados", "Sem balançar o tronco"],
    alts: ["elevacao-lateral-polia", "elevacao-lateral-maquina"],
  },
  {
    id: "elevacao-lateral-polia", name: "Elevação lateral na polia", group: "ombros",
    equipment: "polia", sets: 3, range: [12, 15], rest: 60, rir: 1,
    cues: ["Polia na altura baixa, cabo cruzando à frente do corpo", "Movimento contínuo"],
    alts: ["elevacao-lateral-halteres", "elevacao-lateral-maquina"],
  },
  {
    id: "elevacao-lateral-maquina", name: "Elevação lateral na máquina", group: "ombros",
    equipment: "maquina", range: [12, 15], rest: 60, rir: 1,
    cues: ["Ombros alinhados com o eixo da máquina", "Controle a descida"],
    alts: ["elevacao-lateral-halteres", "elevacao-lateral-polia"],
  },
  {
    id: "face-pull", name: "Face pull", group: "ombros", secondary: ["costas"],
    equipment: "polia", sets: 2, range: [12, 15], rest: 60, rir: 1,
    cues: ["Corda na altura do rosto", "Puxe separando as mãos", "Cotovelos altos, rotação externa ao final"],
    alts: ["crucifixo-inverso-halteres", "crucifixo-inverso-maquina"],
  },
  {
    id: "crucifixo-inverso-halteres", name: "Crucifixo inverso com halteres", group: "ombros", secondary: ["costas"],
    equipment: "halteres", range: [12, 15], rest: 60, rir: 1,
    cues: ["Tronco inclinado, coluna neutra", "Abra os braços sem encolher os ombros"],
    alts: ["face-pull", "crucifixo-inverso-maquina"],
  },
  {
    id: "crucifixo-inverso-maquina", name: "Crucifixo inverso na máquina", group: "ombros", secondary: ["costas"],
    equipment: "maquina", range: [12, 15], rest: 60, rir: 1,
    cues: ["Peito apoiado", "Braços abrem na altura dos ombros"],
    alts: ["face-pull", "crucifixo-inverso-halteres"],
  },

  // Braços
  {
    id: "rosca-direta-barra", name: "Rosca direta com barra", group: "biceps", secondary: ["antebracos"],
    equipment: "barra", sets: 3, range: [8, 12], rest: 75, rir: 1,
    cues: ["Cotovelos fixos ao lado do corpo", "Sem impulso do tronco", "Desça até estender os braços"],
    alts: ["rosca-alternada-halteres", "rosca-polia"],
  },
  {
    id: "rosca-alternada-halteres", name: "Rosca alternada com halteres", group: "biceps", secondary: ["antebracos"],
    equipment: "halteres", range: [8, 12], rest: 75, rir: 1,
    cues: ["Supine o punho durante a subida", "Cotovelos estáveis"],
    alts: ["rosca-direta-barra", "rosca-polia"],
  },
  {
    id: "rosca-polia", name: "Rosca na polia", group: "biceps",
    equipment: "polia", range: [10, 15], rest: 60, rir: 1,
    cues: ["Tensão constante", "Cotovelos à frente do tronco, fixos"],
    alts: ["rosca-direta-barra", "rosca-alternada-halteres"],
  },
  {
    id: "rosca-martelo", name: "Rosca martelo", group: "biceps", secondary: ["antebracos"],
    equipment: "halteres", sets: 3, range: [10, 12], rest: 75, rir: 1,
    cues: ["Pegada neutra (palmas para dentro)", "Cotovelos fixos", "Controle a descida"],
    alts: ["rosca-martelo-corda", "rosca-alternada-halteres"],
  },
  {
    id: "rosca-martelo-corda", name: "Rosca martelo na polia com corda", group: "biceps", secondary: ["antebracos"],
    equipment: "polia", range: [10, 15], rest: 60, rir: 1,
    cues: ["Pegada neutra na corda", "Cotovelos ao lado do corpo"],
    alts: ["rosca-martelo", "rosca-polia"],
  },
  {
    id: "triceps-corda", name: "Tríceps na polia com corda", group: "triceps",
    equipment: "polia", sets: 3, range: [10, 12], rest: 75, rir: 1,
    cues: ["Cotovelos fixos ao lado do corpo", "Separe as pontas da corda no final", "Retorno controlado"],
    alts: ["triceps-barra-polia", "triceps-frances-halter"],
  },
  {
    id: "triceps-barra-polia", name: "Tríceps na polia com barra", group: "triceps",
    equipment: "polia", range: [10, 12], rest: 75, rir: 1,
    cues: ["Cotovelos fixos", "Estenda completamente sem mover os ombros"],
    alts: ["triceps-corda", "triceps-overhead-polia"],
  },
  {
    id: "triceps-frances-halter", name: "Tríceps francês com halter", group: "triceps",
    equipment: "halteres", sets: 2, range: [10, 12], rest: 75, rir: 1,
    cues: ["Sentado com apoio nas costas", "Cotovelos apontados para cima", "Amplitude confortável para os ombros"],
    alts: ["triceps-overhead-polia", "triceps-testa-barra"],
  },
  {
    id: "triceps-testa-barra", name: "Tríceps testa com barra", group: "triceps",
    equipment: "barra", range: [8, 12], rest: 75, rir: 2,
    cues: ["Barra desce em direção à testa ou atrás da cabeça", "Cotovelos estáveis"],
    alts: ["triceps-frances-halter", "triceps-overhead-polia"],
  },
  {
    id: "triceps-overhead-polia", name: "Tríceps acima da cabeça na polia", group: "triceps",
    equipment: "polia", range: [10, 15], rest: 60, rir: 1,
    cues: ["De costas para a polia", "Cotovelos próximos à cabeça"],
    alts: ["triceps-frances-halter", "triceps-corda"],
  },
  {
    id: "supino-fechado", name: "Supino com pegada fechada", group: "triceps", secondary: ["peitoral", "ombros"],
    equipment: "barra", sets: 3, range: [6, 10], rest: 120, rir: 2,
    cues: ["Pegada na largura dos ombros", "Cotovelos próximos ao tronco", "Barra toca a parte baixa do peito"],
    alts: ["flexao-diamante", "triceps-testa-barra"],
  },
  {
    id: "flexao-diamante", name: "Flexão com mãos próximas", group: "triceps", secondary: ["peitoral"],
    equipment: "peso_corporal", range: [8, 15], rest: 90, rir: 2,
    cues: ["Mãos sob o peito", "Cotovelos próximos ao corpo", "Corpo alinhado"],
    alts: ["supino-fechado", "triceps-corda"],
  },

  // Pernas
  {
    id: "agachamento-livre", name: "Agachamento livre com barra", group: "quadriceps", secondary: ["gluteos", "posteriores", "abdomen"],
    equipment: "barra", sets: 4, range: [6, 8], rest: 150, rir: 2,
    cues: ["Pés na largura dos ombros", "Joelhos acompanham a direção dos pés", "Tronco firme e coluna neutra", "Profundidade que mantenha a técnica"],
    alts: ["agachamento-goblet", "leg-press", "agachamento-hack"],
  },
  {
    id: "agachamento-goblet", name: "Agachamento goblet", group: "quadriceps", secondary: ["gluteos", "abdomen"],
    equipment: "halteres", sets: 3, range: [8, 12], rest: 90, rir: 2,
    cues: ["Halter junto ao peito", "Cotovelos entre os joelhos na descida", "Tronco ereto"],
    alts: ["agachamento-livre", "leg-press"],
  },
  {
    id: "leg-press", name: "Leg press", group: "quadriceps", secondary: ["gluteos"],
    equipment: "maquina", sets: 4, range: [8, 12], rest: 120, rir: 2,
    cues: ["Lombar apoiada durante todo o movimento", "Não trave os joelhos no final", "Amplitude sem tirar o quadril do banco"],
    alts: ["agachamento-hack", "agachamento-goblet"],
  },
  {
    id: "agachamento-hack", name: "Agachamento no hack", group: "quadriceps", secondary: ["gluteos"],
    equipment: "maquina", range: [8, 12], rest: 120, rir: 2,
    cues: ["Costas apoiadas", "Descida controlada", "Joelhos alinhados aos pés"],
    alts: ["leg-press", "agachamento-livre"],
  },
  {
    id: "cadeira-extensora", name: "Cadeira extensora", group: "quadriceps",
    equipment: "maquina", range: [10, 15], rest: 75, rir: 1,
    cues: ["Eixo da máquina alinhado ao joelho", "Pausa breve em cima"],
    alts: ["leg-press", "agachamento-goblet"],
  },
  {
    id: "terra-romeno", name: "Levantamento terra romeno", group: "posteriores", secondary: ["gluteos", "costas"],
    equipment: "barra", sets: 3, range: [8, 10], rest: 120, rir: 2,
    cues: ["Joelhos levemente flexionados", "Quadril vai para trás", "Barra próxima às pernas", "Coluna neutra durante todo o movimento"],
    alts: ["terra-romeno-halteres", "mesa-flexora"],
  },
  {
    id: "terra-romeno-halteres", name: "Terra romeno com halteres", group: "posteriores", secondary: ["gluteos"],
    equipment: "halteres", range: [8, 12], rest: 90, rir: 2,
    cues: ["Halteres deslizam próximos às coxas", "Quadril para trás, coluna neutra"],
    alts: ["terra-romeno", "mesa-flexora"],
  },
  {
    id: "mesa-flexora", name: "Mesa flexora", group: "posteriores",
    equipment: "maquina", sets: 3, range: [10, 12], rest: 90, rir: 1,
    cues: ["Quadril apoiado no banco", "Flexione sem tirar o quadril", "Retorno controlado"],
    alts: ["cadeira-flexora", "terra-romeno-halteres"],
  },
  {
    id: "cadeira-flexora", name: "Cadeira flexora", group: "posteriores",
    equipment: "maquina", range: [10, 12], rest: 90, rir: 1,
    cues: ["Eixo alinhado ao joelho", "Coxas presas pelo apoio"],
    alts: ["mesa-flexora", "terra-romeno-halteres"],
  },
  {
    id: "afundo-bulgaro", name: "Agachamento búlgaro", group: "quadriceps", secondary: ["gluteos"],
    equipment: "halteres", sets: 3, range: [8, 12], rest: 90, rir: 2,
    cues: ["Pé de trás apoiado no banco", "Tronco levemente inclinado", "Registre as repetições por perna"],
    alts: ["passada-halteres", "agachamento-goblet"],
  },
  {
    id: "passada-halteres", name: "Passada com halteres", group: "quadriceps", secondary: ["gluteos"],
    equipment: "halteres", range: [8, 12], rest: 90, rir: 2,
    cues: ["Passo amplo e estável", "Joelho de trás desce em direção ao chão"],
    alts: ["afundo-bulgaro", "agachamento-goblet"],
  },
  {
    id: "elevacao-pelvica", name: "Elevação pélvica", group: "gluteos", secondary: ["posteriores"],
    equipment: "barra", range: [8, 12], rest: 90, rir: 2,
    cues: ["Costas apoiadas no banco", "Queixo recolhido", "Contraia os glúteos no topo"],
    alts: ["ponte-gluteo"],
  },
  {
    id: "ponte-gluteo", name: "Ponte de glúteo", group: "gluteos",
    equipment: "peso_corporal", range: [10, 15], rest: 60, rir: 2,
    cues: ["Deitado, pés apoiados", "Eleve o quadril contraindo os glúteos"],
    alts: ["elevacao-pelvica"],
  },
  {
    id: "panturrilha-em-pe", name: "Panturrilha em pé", group: "panturrilhas",
    equipment: "maquina", sets: 3, range: [10, 15], rest: 60, rir: 1,
    cues: ["Amplitude completa", "Pausa breve embaixo e em cima"],
    alts: ["panturrilha-sentado", "panturrilha-leg-press"],
  },
  {
    id: "panturrilha-sentado", name: "Panturrilha sentado", group: "panturrilhas",
    equipment: "maquina", range: [12, 20], rest: 60, rir: 1,
    cues: ["Movimento lento e controlado"],
    alts: ["panturrilha-em-pe", "panturrilha-leg-press"],
  },
  {
    id: "panturrilha-leg-press", name: "Panturrilha no leg press", group: "panturrilhas",
    equipment: "maquina", range: [10, 15], rest: 60, rir: 1,
    cues: ["Apoie a ponta dos pés na plataforma", "Joelhos estendidos sem travar"],
    alts: ["panturrilha-em-pe", "panturrilha-sentado"],
  },

  // Abdômen / estabilidade
  {
    id: "prancha", name: "Prancha", group: "abdomen",
    equipment: "peso_corporal", unit: "seconds", sets: 3, range: [30, 45], rest: 60, rir: null,
    cues: ["Antebraços sob os ombros", "Corpo alinhado, glúteos contraídos", "Respiração contínua"],
    alts: ["dead-bug", "roda-abdominal"],
  },
  {
    id: "prancha-lateral", name: "Prancha lateral", group: "abdomen",
    equipment: "peso_corporal", unit: "seconds", range: [20, 40], rest: 45, rir: null,
    cues: ["Cotovelo sob o ombro", "Quadril elevado e alinhado", "Registre o tempo por lado"],
    alts: ["pallof-press", "prancha"],
  },
  {
    id: "abdominal-polia", name: "Abdominal na polia", group: "abdomen",
    equipment: "polia", sets: 3, range: [10, 15], rest: 60, rir: 1,
    cues: ["Ajoelhado, corda junto à cabeça", "Flexione o tronco aproximando costelas e quadril", "Quadril parado"],
    alts: ["elevacao-pernas-solo", "roda-abdominal"],
  },
  {
    id: "elevacao-pernas-suspenso", name: "Elevação de pernas suspenso", group: "abdomen", secondary: ["antebracos"],
    equipment: "peso_corporal", sets: 3, range: [8, 12], rest: 60, rir: 1,
    cues: ["Evite balançar", "Eleve as pernas enrolando a pelve", "Descida controlada"],
    alts: ["elevacao-pernas-solo", "abdominal-polia"],
  },
  {
    id: "elevacao-pernas-solo", name: "Elevação de pernas no solo", group: "abdomen",
    equipment: "peso_corporal", range: [10, 15], rest: 60, rir: 1,
    cues: ["Lombar apoiada no solo", "Desça as pernas só até manter a lombar apoiada"],
    alts: ["elevacao-pernas-suspenso", "dead-bug"],
  },
  {
    id: "pallof-press", name: "Pallof press", group: "abdomen",
    equipment: "polia", sets: 3, range: [10, 12], rest: 60, rir: 2,
    cues: ["Lateral para a polia, cabo na altura do peito", "Estenda os braços resistindo à rotação", "Registre as repetições por lado"],
    alts: ["prancha-lateral", "dead-bug"],
  },
  {
    id: "dead-bug", name: "Dead bug", group: "abdomen",
    equipment: "peso_corporal", range: [8, 12], rest: 45, rir: 2,
    cues: ["Lombar apoiada no solo", "Estenda braço e perna opostos lentamente", "Expire durante a extensão"],
    alts: ["prancha", "pallof-press"],
  },
  {
    id: "roda-abdominal", name: "Roda abdominal", group: "abdomen",
    equipment: "peso_corporal", range: [6, 12], rest: 75, rir: 2,
    cues: ["Comece ajoelhado", "Amplitude que mantenha a lombar neutra", "Retorne contraindo o abdômen"],
    alts: ["prancha", "abdominal-polia"],
  },
];

function toExercise(d: Def): Exercise {
  return {
    id: d.id,
    name: d.name,
    muscleGroup: d.group,
    secondaryGroups: d.secondary ?? [],
    equipment: d.equipment,
    repUnit: d.unit ?? "reps",
    defaultSets: d.sets ?? 3,
    repMin: d.range[0],
    repMax: d.range[1],
    restSeconds: d.rest,
    targetRir: d.rir === undefined ? 2 : d.rir,
    cues: d.cues,
    mediaUrl: null,
    alternativeIds: d.alts ?? [],
    custom: false,
    updatedAt: 0,
    deletedAt: null,
  };
}

/** Catálogo com alternativas tornadas recíprocas. */
export function buildSeedExercises(): Exercise[] {
  const list = DEFS.map(toExercise);
  const byId = new Map(list.map((e) => [e.id, e]));
  for (const e of list) {
    for (const altId of e.alternativeIds) {
      const alt = byId.get(altId);
      if (!alt) throw new Error(`Alternativa inexistente: ${altId} (em ${e.id})`);
      if (!alt.alternativeIds.includes(e.id)) alt.alternativeIds.push(e.id);
    }
  }
  return list;
}

type Slot = [exerciseId: string, sets: number, repMin: number, repMax: number, rest: number, rir: number | null];

function items(prefix: string, slots: Slot[]): TemplateItem[] {
  return slots.map(([exerciseId, sets, repMin, repMax, restSeconds, targetRir], i) => ({
    slotId: `${prefix}${i + 1}`,
    exerciseId,
    sets,
    repMin,
    repMax,
    restSeconds,
    targetRir,
  }));
}

export function buildSeedTemplates(): WorkoutTemplate[] {
  const base = { updatedAt: 0, deletedAt: null };
  return [
    {
      ...base,
      id: "A",
      name: "Full Body A",
      focus: "Peitoral, costas e abdômen",
      weekday: 1,
      items: items("A", [
        ["supino-reto-barra", 4, 6, 8, 150, 2],
        ["remada-curvada-barra", 4, 6, 10, 120, 2],
        ["agachamento-goblet", 3, 8, 12, 90, 2],
        ["supino-inclinado-halteres", 3, 8, 12, 90, 1],
        ["puxada-frontal", 3, 8, 12, 90, 1],
        ["elevacao-lateral-halteres", 2, 12, 15, 60, 1],
        ["abdominal-polia", 3, 10, 15, 60, 1],
        ["prancha", 3, 30, 45, 60, null],
      ]),
    },
    {
      ...base,
      id: "B",
      name: "Full Body B",
      focus: "Ombros, braços e pernas",
      weekday: 2,
      items: items("B", [
        ["agachamento-livre", 4, 6, 8, 150, 2],
        ["desenvolvimento-halteres", 3, 8, 10, 120, 2],
        ["terra-romeno", 3, 8, 10, 120, 2],
        ["remada-baixa-polia", 2, 10, 12, 90, 1],
        ["supino-maquina", 2, 10, 12, 90, 1],
        ["rosca-direta-barra", 3, 8, 12, 75, 1],
        ["triceps-corda", 3, 10, 12, 75, 1],
        ["panturrilha-em-pe", 3, 10, 15, 60, 1],
      ]),
    },
    {
      ...base,
      id: "C",
      name: "Full Body C",
      focus: "Costas, peitoral e abdômen",
      weekday: 4,
      items: items("C", [
        ["barra-fixa", 4, 5, 8, 150, 2],
        ["supino-inclinado-barra", 4, 6, 10, 120, 2],
        ["remada-unilateral-halter", 3, 8, 12, 90, 1],
        ["crucifixo-maquina", 3, 10, 15, 75, 1],
        ["afundo-bulgaro", 3, 8, 12, 90, 2],
        ["face-pull", 2, 12, 15, 60, 1],
        ["pallof-press", 3, 10, 12, 60, 2],
        ["elevacao-pernas-suspenso", 3, 8, 12, 60, 1],
      ]),
    },
    {
      ...base,
      id: "D",
      name: "Full Body D",
      focus: "Ombros, braços e pernas",
      weekday: 5,
      items: items("D", [
        ["leg-press", 4, 8, 12, 120, 2],
        ["desenvolvimento-barra", 4, 6, 8, 150, 2],
        ["mesa-flexora", 3, 10, 12, 90, 1],
        ["supino-fechado", 3, 6, 10, 120, 2],
        ["puxada-supinada", 2, 8, 12, 90, 1],
        ["rosca-martelo", 3, 10, 12, 75, 1],
        ["elevacao-lateral-polia", 3, 12, 15, 60, 1],
        ["triceps-frances-halter", 2, 10, 12, 75, 1],
      ]),
    },
  ];
}

export const WEEK_PLAN: { weekday: number; label: string; templateId: "A" | "B" | "C" | "D" | null }[] = [
  { weekday: 1, label: "Segunda", templateId: "A" },
  { weekday: 2, label: "Terça", templateId: "B" },
  { weekday: 3, label: "Quarta", templateId: null },
  { weekday: 4, label: "Quinta", templateId: "C" },
  { weekday: 5, label: "Sexta", templateId: "D" },
  { weekday: 6, label: "Sábado", templateId: null },
  { weekday: 0, label: "Domingo", templateId: null },
];
