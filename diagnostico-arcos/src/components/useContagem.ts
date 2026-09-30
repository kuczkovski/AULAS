"use client";
import { useEffect, useState } from "react";

/** Segundos restantes até `prazo`, usando o relógio do servidor (deslocamento = servidor − aparelho, em ms). */
export function useContagem(prazo: string | undefined, deslocamento: number | undefined): number | null {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  if (!prazo || deslocamento === undefined) return null;
  return Math.max(0, Math.ceil((new Date(prazo).getTime() - (agora + deslocamento)) / 1000));
}

export function mmss(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
