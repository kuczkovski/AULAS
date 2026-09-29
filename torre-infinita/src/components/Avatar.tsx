import type { Avatar as AvatarDados } from "@/engine/tipos";
import { ZONAS, infoZona } from "@/engine/zonas";

export const CORES = ["#5b3df5", "#e08a00", "#12a150", "#e5487a", "#0d8fd1", "#e2571b"];
export const FORMAS = ["Redondo", "Gotinha", "Cristal", "Quadradão"];
export interface Acessorio {
  nome: string;
  /** Liberado ao chegar neste nível. */
  nivel?: number;
  /** Ou liberado ao derrotar o chefe desta zona. */
  zona?: string;
}

const NOMES_ZONA: Record<string, string> = {
  "Fundação": "Capacete de tijolos",
  "Números": "Chapéu de mago",
  "Frações": "Chifres de dragão",
  "Inteiros": "Capuz da sombra",
  "Proporção": "Faixa gigante",
  "Álgebra": "Faixa do X",
  "Potências": "Laço de expoente",
  "Geometria": "Chapéu triângulo",
  "Dados": "Olho do oráculo",
  "Problemas": "Boné do mercador",
};

/** Os 4 primeiros vêm por nível; os demais, um por chefe derrotado (na ordem das zonas). */
export const ACESSORIOS: Acessorio[] = [
  { nome: "Nenhum", nivel: 1 },
  { nome: "Óculos", nivel: 3 },
  { nome: "Boné", nivel: 6 },
  { nome: "Coroa", nivel: 10 },
  ...Object.keys(ZONAS).map((zona) => ({ nome: NOMES_ZONA[zona] ?? `Troféu de ${zona}`, zona })),
];

export const acessorioLiberado = (a: Acessorio, nivel: number, chefes: readonly string[]) =>
  a.zona ? chefes.includes(a.zona) : nivel >= (a.nivel ?? 1);

/** Índice do acessório que a vitória sobre o chefe da zona libera. */
export const acessorioDoChefe = (zona: string) => ACESSORIOS.findIndex((a) => a.zona === zona);

/** Desenho do acessório de troféu, na cor da zona. */
function itemDeZona(zona: string) {
  const c = infoZona(zona).cor;
  switch (zona) {
    case "Fundação": return <g><rect x="22" y="6" width="56" height="20" rx="6" fill={c} /><path d="M22 16H78M40 6V16M60 16V26" stroke="#fff" strokeOpacity=".4" strokeWidth="2" /></g>;
    case "Números": return <g><path d="M50 -6L28 24H72Z" fill={c} /><ellipse cx="50" cy="24" rx="28" ry="5" fill={c} /><circle cx="48" cy="10" r="2.4" fill="#ffd54a" /></g>;
    case "Frações": return <g fill={c}><path d="M24 26L14 2L38 14Z" /><path d="M76 26L86 2L62 14Z" /></g>;
    case "Inteiros": return <g><path d="M50 0C26 0 16 22 16 40H84C84 22 74 0 50 0Z" fill={c} opacity=".92" /><rect x="42" y="14" width="16" height="4" rx="2" fill="#fff" /></g>;
    case "Proporção": return <g><rect x="18" y="16" width="64" height="9" rx="4" fill={c} /><circle cx="70" cy="12" r="9" fill={c} /><circle cx="28" cy="14" r="5" fill={c} /></g>;
    case "Álgebra": return <g><rect x="16" y="16" width="68" height="10" rx="5" fill={c} /><path d="M46 12L54 30M54 12L46 30" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></g>;
    case "Potências": return <g><path d="M30 22L18 10L34 14ZM70 22L82 10L66 14Z" fill={c} /><rect x="30" y="16" width="40" height="8" rx="4" fill={c} /><text x="50" y="24" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">x²</text></g>;
    case "Geometria": return <g><path d="M50 -4L24 24H76Z" fill={c} /><path d="M62 16V24H70" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" /></g>;
    case "Dados": return <g><path d="M50 4L64 28H36Z" fill={c} /><ellipse cx="50" cy="20" rx="6" ry="4" fill="#fff" /><circle cx="50" cy="20" r="2.2" fill="#1d1b3a" /></g>;
    default: return <g><path d="M20 26C22 4 78 4 80 26Z" fill={c} /><path d="M66 24H96C96 30 84 31 66 29Z" fill={c} /><circle cx="50" cy="14" r="5" fill="#ffc21a" /></g>;
  }
}

const CORPO = [
  "M50 8 C76 8 92 26 92 52 C92 78 74 94 50 94 C26 94 8 78 8 52 C8 26 24 8 50 8Z",
  "M50 6 C72 22 92 40 92 62 C92 82 74 94 50 94 C26 94 8 82 8 62 C8 40 28 22 50 6Z",
  "M50 6 L88 28 L88 72 L50 94 L12 72 L12 28Z",
  "M22 12 H78 C86 12 92 18 92 26 V74 C92 82 86 90 78 90 H22 C14 90 8 82 8 74 V26 C8 18 14 12 22 12Z",
];

export function Avatar({ avatar, tamanho = 64, titulo }: { avatar: Partial<AvatarDados>; tamanho?: number; titulo?: string }) {
  const cor = CORES[avatar.cor ?? 0] ?? CORES[0]!;
  const forma = CORPO[avatar.forma ?? 0] ?? CORPO[0]!;
  const acessorio = avatar.acessorio ?? 0;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" role="img" aria-label={titulo ?? "Avatar"} className="shrink-0 overflow-visible">
      <path d={forma} fill={cor} />
      <path d={forma} fill="none" stroke="rgb(0 0 0 / .14)" strokeWidth="3" />
      <ellipse cx="36" cy="52" rx="7" ry="8" fill="#fff" />
      <ellipse cx="64" cy="52" rx="7" ry="8" fill="#fff" />
      <circle cx="38" cy="54" r="3.6" fill="#1d1b3a" />
      <circle cx="62" cy="54" r="3.6" fill="#1d1b3a" />
      <path d="M38 72 Q50 82 62 72" fill="none" stroke="#1d1b3a" strokeWidth="4" strokeLinecap="round" />
      {acessorio === 1 && (
        <g fill="none" stroke="#1d1b3a" strokeWidth="3.5">
          <circle cx="36" cy="52" r="11" /><circle cx="64" cy="52" r="11" /><path d="M47 52 H53" />
        </g>
      )}
      {acessorio === 2 && (
        <g>
          <path d="M18 34 C22 14 78 14 82 34 Z" fill="#1d1b3a" />
          <path d="M60 32 H98 C98 38 90 40 60 38Z" fill="#1d1b3a" />
        </g>
      )}
      {acessorio >= 4 && ACESSORIOS[acessorio]?.zona && itemDeZona(ACESSORIOS[acessorio]!.zona!)}
      {acessorio === 3 && (
        <path d="M24 26 L30 4 L42 18 L50 0 L58 18 L70 4 L76 26 Z" fill="#ffc21a" stroke="#b26a00" strokeWidth="2.5" strokeLinejoin="round" />
      )}
    </svg>
  );
}
