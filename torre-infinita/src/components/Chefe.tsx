import { infoZona } from "@/engine/zonas";

const OLHO = "#1d1b3a";

/** Retrato do chefe de cada zona. Um desenho próprio por zona, na cor da zona. */
export function RetratoChefe({ zona, tamanho = 96, apagado = false, titulo }: { zona: string; tamanho?: number; apagado?: boolean; titulo?: string }) {
  const c = infoZona(zona).cor;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" role="img" aria-label={titulo ?? `Chefe: ${infoZona(zona).chefe.nome}`} className="shrink-0" style={apagado ? { filter: "grayscale(1)", opacity: 0.45 } : undefined}>
      {desenho(zona, c)}
    </svg>
  );
}

function desenho(zona: string, c: string) {
  switch (zona) {
    case "Fundação": // golem de tijolos
      return (
        <g>
          <rect x="10" y="8" width="44" height="48" rx="7" fill={c} />
          <g stroke="#fff" strokeOpacity=".28" strokeWidth="1.5"><path d="M10 24H54M10 40H54M28 8V24M42 24V40M22 40V56" /></g>
          <rect x="17" y="22" width="11" height="9" rx="2" fill="#ffd54a" /><rect x="36" y="22" width="11" height="9" rx="2" fill="#ffd54a" />
          <rect x="21" y="25" width="4" height="5" fill={OLHO} /><rect x="40" y="25" width="4" height="5" fill={OLHO} />
          <rect x="20" y="42" width="24" height="7" rx="2" fill={OLHO} /><path d="M26 42V49M32 42V49M38 42V49" stroke="#fff" strokeWidth="1.5" />
          <path d="M46 8L42 16L47 20" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" />
        </g>
      );
    case "Números": // mago
      return (
        <g>
          <path d="M32 3L12 30H52Z" fill={c} /><ellipse cx="32" cy="30" rx="24" ry="5" fill={c} />
          <circle cx="30" cy="18" r="2.2" fill="#ffd54a" /><circle cx="38" cy="24" r="1.6" fill="#ffd54a" />
          <circle cx="32" cy="41" r="13" fill="#fde7d0" />
          <circle cx="27" cy="39" r="2" fill={OLHO} /><circle cx="37" cy="39" r="2" fill={OLHO} />
          <path d="M19 44C20 60 44 60 45 44C40 50 24 50 19 44Z" fill="#fff" stroke="#cbd5e1" />
        </g>
      );
    case "Frações": // dragão
      return (
        <g>
          <path d="M14 22L10 6L26 16ZM50 22L54 6L38 16Z" fill={c} opacity=".85" />
          <ellipse cx="32" cy="34" rx="22" ry="20" fill={c} />
          <ellipse cx="32" cy="45" rx="14" ry="9" fill="#fff" fillOpacity=".3" />
          <ellipse cx="22" cy="30" rx="4.5" ry="6" fill="#ffd54a" /><ellipse cx="42" cy="30" rx="4.5" ry="6" fill="#ffd54a" />
          <rect x="21" y="26" width="2" height="8" rx="1" fill={OLHO} /><rect x="41" y="26" width="2" height="8" rx="1" fill={OLHO} />
          <path d="M24 46L27 52L30 46L33 52L36 46L39 52L42 46" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="28" cy="41" r="1.4" fill={OLHO} /><circle cx="36" cy="41" r="1.4" fill={OLHO} />
        </g>
      );
    case "Inteiros": // sombra encapuzada
      return (
        <g>
          <path d="M32 4C14 4 8 22 8 40V58H56V40C56 22 50 4 32 4Z" fill={c} />
          <path d="M32 14C22 14 18 24 18 34C18 46 24 52 32 52C40 52 46 46 46 34C46 24 42 14 32 14Z" fill="#0f172a" />
          <ellipse cx="26" cy="34" rx="3.4" ry="4.6" fill="#fff" /><ellipse cx="38" cy="34" rx="3.4" ry="4.6" fill="#fff" />
          <rect x="26" y="19" width="12" height="3.4" rx="1.6" fill="#fff" />
        </g>
      );
    case "Proporção": // gigante com cabecinha
      return (
        <g>
          <circle cx="30" cy="36" r="23" fill={c} />
          <circle cx="52" cy="14" r="8" fill={c} opacity=".65" />
          <circle cx="50" cy="13" r="1.5" fill={OLHO} /><circle cx="55" cy="13" r="1.5" fill={OLHO} />
          <circle cx="22" cy="32" r="5" fill="#fff" /><circle cx="38" cy="32" r="5" fill="#fff" />
          <circle cx="23" cy="33" r="2.4" fill={OLHO} /><circle cx="39" cy="33" r="2.4" fill={OLHO} />
          <path d="M14 22L28 27M46 22L32 27" stroke={OLHO} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M20 46Q30 54 40 46" fill="none" stroke={OLHO} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "Álgebra": // esfinge
      return (
        <g>
          <path d="M12 12H52L58 58H6Z" fill={c} />
          <g stroke="#fff" strokeOpacity=".35" strokeWidth="2"><path d="M14 22H50M12 32H52M10 42H54" /></g>
          <rect x="20" y="12" width="24" height="40" rx="10" fill="#f3d9b8" />
          <path d="M23 26H30M34 26H41" stroke={OLHO} strokeWidth="3" strokeLinecap="round" />
          <circle cx="27" cy="29" r="1.6" fill={OLHO} /><circle cx="37" cy="29" r="1.6" fill={OLHO} />
          <path d="M28 17L36 25M36 17L28 25" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M27 44H37" stroke={OLHO} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case "Potências": // hidra de três cabeças
      return (
        <g>
          <path d="M32 60C32 44 14 40 14 22M32 60C32 40 32 30 32 14M32 60C32 44 50 40 50 22" fill="none" stroke={c} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="32" cy="60" rx="20" ry="5" fill={c} />
          {[[14, 20], [32, 12], [50, 20]].map(([x, y]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="8.5" fill={c} />
              <circle cx={x! - 3} cy={y! - 1} r="2.2" fill="#ffd54a" /><circle cx={x! + 3} cy={y! - 1} r="2.2" fill="#ffd54a" />
              <circle cx={x! - 3} cy={y! - 1} r="1" fill={OLHO} /><circle cx={x! + 3} cy={y! - 1} r="1" fill={OLHO} />
            </g>
          ))}
          <text x="32" y="55" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">x³</text>
        </g>
      );
    case "Geometria": // arquiteta em triângulo
      return (
        <g>
          <path d="M32 5L5 57H59Z" fill={c} />
          <path d="M44 49V57H52" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
          <circle cx="26" cy="38" r="3.4" fill="#fff" /><circle cx="38" cy="38" r="3.4" fill="#fff" />
          <circle cx="26.6" cy="38.6" r="1.6" fill={OLHO} /><circle cx="38.6" cy="38.6" r="1.6" fill={OLHO} />
          <path d="M27 47Q32 51 37 47" fill="none" stroke={OLHO} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M32 3L32 16M32 3L28 12M32 3L36 12" stroke="#ffd54a" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "Dados": // oráculo: pirâmide com olho
      return (
        <g>
          <path d="M32 4L60 52H4Z" fill={c} />
          <ellipse cx="32" cy="34" rx="13" ry="8" fill="#fff" />
          <circle cx="32" cy="34" r="5.5" fill="#ffd54a" /><circle cx="32" cy="34" r="2.6" fill={OLHO} />
          <rect x="8" y="53" width="10" height="10" rx="2" fill="#fff" stroke={c} strokeWidth="1.5" /><circle cx="13" cy="58" r="1.4" fill={c} />
          <rect x="46" y="53" width="10" height="10" rx="2" fill="#fff" stroke={c} strokeWidth="1.5" /><circle cx="49.5" cy="56.5" r="1.2" fill={c} /><circle cx="52.5" cy="59.5" r="1.2" fill={c} />
        </g>
      );
    default: // Problemas: mercador
      return (
        <g>
          <path d="M12 26C14 8 50 8 52 26Z" fill={c} /><path d="M40 24H62C62 30 52 31 40 29Z" fill={c} />
          <circle cx="32" cy="38" r="17" fill="#fde7d0" />
          <circle cx="26" cy="35" r="2" fill={OLHO} /><circle cx="38" cy="35" r="2" fill={OLHO} />
          <path d="M22 44Q32 40 42 44Q32 49 22 44Z" fill="#7c4a1e" />
          <path d="M26 50Q32 54 38 50" fill="none" stroke={OLHO} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="54" cy="52" r="7" fill="#ffc21a" stroke="#b26a00" strokeWidth="1.6" /><text x="54" y="55.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7a4a00">$</text>
        </g>
      );
  }
}

/** Barra de energia do chefe. */
export function EnergiaChefe({ energia, max }: { energia: number; max: number }) {
  const pct = Math.max(0, (energia / max) * 100);
  return (
    <div className="h-4 overflow-hidden rounded-full bg-linha" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.ceil(energia)} aria-label="Energia do chefe">
      <div className={"h-full rounded-full transition-[width] duration-300 " + (pct <= 34 ? "bg-erro" : "bg-[#f59e0b]")} style={{ width: `${pct}%` }} />
    </div>
  );
}
