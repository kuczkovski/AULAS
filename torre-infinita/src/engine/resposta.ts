import type { Pergunta } from "./tipos";
import { canonico } from "./texto";

export function verificar(p: Pergunta, bruto: string): boolean {
  if (p.formato === "ordenar" || p.formato === "classificar") return bruto === p.resposta;
  if (p.formato === "reta") {
    const v = Number(canonico(bruto)), alvo = Number(canonico(p.resposta));
    return Number.isFinite(v) && Math.abs(v - alvo) <= (p.reta?.tolerancia ?? 0) + 1e-9;
  }
  if (p.formato !== "digitar") return bruto === p.resposta || (p.aceitar ?? []).includes(bruto);
  const c = canonico(bruto);
  if (!c) return false;
  return [p.resposta, ...(p.aceitar ?? [])].some((r) => canonico(r) === c);
}
