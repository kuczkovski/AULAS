import { RetratoChefe } from "./Chefe";

/**
 * A torre em corte: mostra três andares para cima e para baixo do andar atual.
 * Andares vencidos têm janelas acesas; andares de chefe têm uma marca, e o
 * próximo chefe aparece com o retrato da zona que vai enfrentar.
 */
export function TorreSvg({ andar, zonaProximoChefe, largura = 168 }: { andar: number; zonaProximoChefe: string; largura?: number }) {
  const topo = andar + 3;
  const linhas = Array.from({ length: 7 }, (_, i) => topo - i).filter((f) => f >= 1);
  const H = 46, W = 168;
  const proximoChefe = Math.ceil(andar / 5) * 5;
  return (
    <svg viewBox={`0 0 ${W} ${linhas.length * H + 14}`} width={largura} role="img" aria-label={`Torre: você está no andar ${andar}`} className="shrink-0">
      <path d={`M84 2V12M84 2L100 8L84 12`} fill="#ffc21a" stroke="#ffc21a" strokeWidth="2" strokeLinecap="round" />
      {linhas.map((f, i) => {
        const y = 14 + i * H, recuo = Math.max(0, 22 - i * 3);
        const x = 14 + recuo, w = W - 28 - recuo * 2;
        const feito = f < andar, atual = f === andar, chefe = f % 5 === 0;
        return (
          <g key={f}>
            <rect x={x} y={y} width={w} height={H - 8} rx={8} fill={atual ? "#ece8ff" : feito ? "#ffffff" : "#eef1ff"} stroke={atual ? "#5b3df5" : "#dcd9f2"} strokeWidth={atual ? 3 : 2} opacity={feito || atual ? 1 : 0.8} />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={x + 26 + k * ((w - 52) / 2) - 5} y={y + 10} width={10} height={14} rx={3} fill={feito ? "#ffc21a" : atual && k === 0 ? "#5b3df5" : "#dcd9f2"} />
            ))}
            <text x={6} y={y + 24} fontSize="12" fontWeight="800" fill={atual ? "#5b3df5" : "#55527a"}>{f}</text>
            {chefe && f === proximoChefe && f >= andar && (
              <foreignObject x={W - 42} y={y - 4} width="40" height="40"><RetratoChefe zona={zonaProximoChefe} tamanho={40} titulo="Próximo chefe" /></foreignObject>
            )}
            {chefe && f < andar && <text x={W - 24} y={y + 26} fontSize="18" fill="#b26a00" textAnchor="middle" aria-label="Chefe derrotado">★</text>}
            {chefe && f > andar && f !== proximoChefe && <path d={`M${W - 22} ${y + 10}l7 7l-7 7l-7 -7Z`} fill="none" stroke="#e2571b" strokeWidth="2.4" />}
          </g>
        );
      })}
      <rect x="8" y={linhas.length * H + 8} width={W - 16} height="4" rx="2" fill="#dcd9f2" />
    </svg>
  );
}
