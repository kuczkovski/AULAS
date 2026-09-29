"use client";
import { useState } from "react";
import type { Ano } from "@/engine/tipos";
import { supabaseConfigurado } from "@/lib/supabase";
import type { ErroEntrada } from "@/lib/nuvem";

const MENSAGENS: Record<ErroEntrada, string> = {
  "sem-servidor": "O servidor não está configurado. Você pode jogar sem entrar.",
  "codigo-ou-pin-invalido": "Código ou PIN incorreto. Confira o cartão que o professor entregou.",
  bloqueado: "Muitas tentativas erradas. Espere 10 minutos ou peça ao professor para refazer o PIN.",
  rede: "Não deu para falar com o servidor. Verifique a internet e tente de novo.",
};

export function TelaEntrada({
  aoEntrar,
  aoJogarLocal,
}: {
  aoEntrar: (codigo: string, pin: string) => Promise<ErroEntrada | null>;
  aoJogarLocal: (ano: Ano) => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [local, setLocal] = useState(!supabaseConfigurado);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.trim().length < 3 || pin.length < 4) { setErro("Digite o código e o PIN de 4 números."); return; }
    setCarregando(true);
    setErro(null);
    const r = await aoEntrar(codigo.trim(), pin.trim());
    setCarregando(false);
    if (r) setErro(MENSAGENS[r]);
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-6 px-4 py-10">
      <div className="text-center">
        <p className="rotulo">Matemática · 6º ao 9º ano</p>
        <h1 className="mt-1 text-6xl font-black leading-none tracking-tight text-marca">
          Torre<br />Infinita
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-suave">
          Cada andar é uma rodada de desafios. O jogo descobre o que você já sabe e treina o que ainda falta. Não existe último andar.
        </p>
      </div>

      {!local ? (
        <form onSubmit={enviar} className="cartao anim-entra grid gap-4 p-6">
          <label className="grid gap-1.5">
            <span className="rotulo">Seu código</span>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              inputMode="text"
              placeholder="ex.: e2700573"
              className="h-14 rounded-2xl border-2 border-linha bg-white px-4 text-xl font-bold outline-none focus:border-marca"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="rotulo">PIN de 4 números</span>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              autoComplete="off"
              inputMode="numeric"
              type="password"
              placeholder="••••"
              className="h-14 rounded-2xl border-2 border-linha bg-white px-4 text-xl font-bold tracking-[0.5em] outline-none focus:border-marca"
            />
          </label>
          {erro && <p role="alert" className="rounded-xl bg-erro-fundo px-4 py-3 text-base font-bold text-erro">{erro}</p>}
          <button type="submit" disabled={carregando} className="btn btn-marca btn-grande">
            {carregando ? "Entrando…" : "Entrar"}
          </button>
          <button type="button" className="btn btn-fantasma" onClick={() => setLocal(true)}>
            Jogar sem entrar
          </button>
        </form>
      ) : (
        <div className="cartao anim-entra grid gap-4 p-6">
          <p className="text-center text-xl font-black">Em qual ano você está?</p>
          <div className="grid grid-cols-2 gap-3">
            {([6, 7, 8, 9] as const).map((a) => (
              <button key={a} type="button" className="btn btn-suave min-h-20 text-2xl" onClick={() => aoJogarLocal(a)}>
                {a}º ano
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-suave">
            Sem entrar, seu progresso fica só neste navegador: não aparece no placar da turma.
          </p>
          {supabaseConfigurado && (
            <button type="button" className="btn btn-fantasma" onClick={() => setLocal(false)}>
              Voltar: entrar com meu código
            </button>
          )}
        </div>
      )}
    </main>
  );
}
