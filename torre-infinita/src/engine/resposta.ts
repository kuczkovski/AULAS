import type { Pergunta } from "./tipos";
import { canonico } from "./texto";

export function verificar(p: Pergunta, bruto: string): boolean {
  if (p.formato !== "digitar") return bruto === p.resposta || (p.aceitar ?? []).includes(bruto);
  const c = canonico(bruto);
  if (!c) return false;
  return [p.resposta, ...(p.aceitar ?? [])].some((r) => canonico(r) === c);
}
