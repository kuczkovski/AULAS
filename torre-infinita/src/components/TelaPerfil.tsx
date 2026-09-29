"use client";
import { useState } from "react";
import type { Avatar as AvatarDados } from "@/engine/tipos";
import { infoZona } from "@/engine/zonas";
import { ACESSORIOS, Avatar, CORES, FORMAS, acessorioLiberado } from "./Avatar";

export function TelaPerfil({
  apelido: apelidoInicial,
  avatar: avatarInicial,
  nivel,
  chefes,
  primeiraVez,
  aoSalvar,
  aoVoltar,
}: {
  apelido: string;
  avatar: AvatarDados;
  nivel: number;
  chefes: string[];
  primeiraVez: boolean;
  aoSalvar: (apelido: string, avatar: AvatarDados) => Promise<string | null>;
  aoVoltar?: () => void;
}) {
  const [apelido, setApelido] = useState(apelidoInicial);
  const [avatar, setAvatar] = useState<AvatarDados>(avatarInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const limpo = apelido.replace(/[^\p{L}\p{N} .]/gu, "").replace(/\s+/g, " ").trim();

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (limpo.length < 2) { setErro("Escolha um apelido com pelo menos 2 letras."); return; }
    setSalvando(true);
    setErro(null);
    setErro(await aoSalvar(limpo, avatar));
    setSalvando(false);
  }

  const escolher = (chave: keyof AvatarDados, v: number) => setAvatar((a) => ({ ...a, [chave]: v }));

  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-5 px-4 py-8">
      <form onSubmit={salvar} className="cartao anim-entra grid gap-5 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-black">{primeiraVez ? "Crie seu personagem" : "Seu personagem"}</h1>
          <p className="mt-1 text-suave">O apelido aparece no placar da turma. Use um nome que não revele quem você é.</p>
        </div>
        <div className="flex justify-center"><Avatar avatar={avatar} tamanho={120} /></div>

        <label className="grid gap-1.5">
          <span className="rotulo">Apelido</span>
          <input
            value={apelido}
            onChange={(e) => setApelido(e.target.value.slice(0, 14))}
            autoComplete="off"
            placeholder="ex.: Raio Veloz"
            className="h-14 rounded-2xl border-2 border-linha bg-white px-4 text-xl font-bold outline-none focus:border-marca"
          />
        </label>

        <fieldset>
          <legend className="rotulo mb-2">Cor</legend>
          <div className="flex flex-wrap gap-2">
            {CORES.map((c, i) => (
              <button key={c} type="button" onClick={() => escolher("cor", i)} aria-label={`Cor ${i + 1}`} aria-pressed={avatar.cor === i}
                className={"size-11 rounded-full border-4 " + (avatar.cor === i ? "border-tinta" : "border-white shadow")} style={{ background: c }} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="rotulo mb-2">Forma</legend>
          <div className="flex flex-wrap gap-2">
            {FORMAS.map((f, i) => (
              <button key={f} type="button" onClick={() => escolher("forma", i)} aria-pressed={avatar.forma === i}
                className={"btn min-h-11 border-2 px-4 " + (avatar.forma === i ? "border-marca bg-marca-clara text-marca-escura" : "border-linha bg-white")}>
                {f}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="rotulo mb-2">Acessório</legend>
          <div className="flex flex-wrap gap-2">
            {ACESSORIOS.map((a, i) => {
              const livre = acessorioLiberado(a, nivel, chefes);
              return (
                <button key={a.nome} type="button" disabled={!livre} onClick={() => escolher("acessorio", i)} aria-pressed={avatar.acessorio === i}
                  className={"btn min-h-11 border-2 px-4 " + (avatar.acessorio === i ? "border-marca bg-marca-clara text-marca-escura" : "border-linha bg-white")}>
                  {a.nome}{!livre && <span className="text-xs font-bold text-suave"> · {a.zona ? `derrote ${infoZona(a.zona).chefe.nome}` : `nível ${a.nivel}`}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>

        {erro && <p role="alert" className="rounded-xl bg-erro-fundo px-4 py-3 text-base font-bold text-erro">{erro}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <button type="submit" disabled={salvando} className="btn btn-marca btn-grande">{salvando ? "Salvando…" : primeiraVez ? "Pronto!" : "Salvar"}</button>
          {aoVoltar && <button type="button" className="btn btn-fantasma" onClick={aoVoltar}>Voltar</button>}
        </div>
      </form>
    </main>
  );
}
