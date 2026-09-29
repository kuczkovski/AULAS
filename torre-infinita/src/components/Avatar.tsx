import type { Avatar as AvatarDados } from "@/engine/tipos";

export const CORES = ["#5b3df5", "#e08a00", "#12a150", "#e5487a", "#0d8fd1", "#e2571b"];
export const FORMAS = ["Redondo", "Gotinha", "Cristal", "Quadradão"];
export const ACESSORIOS = ["Nenhum", "Óculos", "Boné", "Coroa"];
/** Nível necessário para liberar cada acessório. */
export const NIVEL_ACESSORIO = [1, 3, 6, 10];

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
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" role="img" aria-label={titulo ?? "Avatar"} className="shrink-0">
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
      {acessorio === 3 && (
        <path d="M24 26 L30 4 L42 18 L50 0 L58 18 L70 4 L76 26 Z" fill="#ffc21a" stroke="#b26a00" strokeWidth="2.5" strokeLinejoin="round" />
      )}
    </svg>
  );
}
