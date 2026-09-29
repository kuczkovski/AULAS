"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { alertasDoAluno, celulaDoMapa, dificuldadesDaTurma, type Alerta } from "@/engine/analise";
import { HABILIDADES } from "@/engine/habilidades";
import { pt } from "@/lib/formato";
import {
  atualizarMeta, carregarTurma, criarTurma, entrarProfessor, importarAlunos, lerLista, listarTurmas,
  professorAtual, resetarPin, sairProfessor, type AlunoLinha, type PinNovo, type Turma,
} from "@/lib/professor";
import { supabaseConfigurado } from "@/lib/supabase";

type Aba = "geral" | "habilidades" | "alunos";

const ROTULO_ALERTA: Record<Alerta, string> = {
  "nunca-jogou": "ainda não jogou",
  travado: "travado (2+ quedas)",
  parado: "parado há 7+ dias",
};
const COR_CELULA = (d: number | null, sit: string) =>
  sit === "bloqueada" ? "bg-linha" : d === null ? "border-2 border-dashed border-marca/40 bg-white" : d < 0.35 ? "bg-erro" : d < 0.6 ? "bg-[#f5b400]" : d < 0.8 ? "bg-[#7bd389]" : "bg-ok";

const quando = (iso: string | null) => {
  if (!iso) return "—";
  const dias = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  return dias <= 0 ? "hoje" : dias === 1 ? "ontem" : `há ${dias} dias`;
};

export function PainelProfessor() {
  const [prof, setProf] = useState<{ id: string; email: string } | null | undefined>(undefined);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [alunos, setAlunos] = useState<AlunoLinha[]>([]);
  const [aba, setAba] = useState<Aba>("geral");
  const [erro, setErro] = useState<string | null>(null);
  const [pins, setPins] = useState<PinNovo[]>([]);

  const turma = turmas.find((t) => t.id === turmaId) ?? null;

  const recarregarTurmas = useCallback(async (selecionar?: string) => {
    const ts = await listarTurmas();
    setTurmas(ts);
    setTurmaId((atual) => selecionar ?? atual ?? ts[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (!supabaseConfigurado) { setProf(null); return; }
    professorAtual().then((p) => { setProf(p); if (p) recarregarTurmas().catch(() => setErro("Não foi possível carregar as turmas.")); }).catch(() => setProf(null));
  }, [recarregarTurmas]);

  const recarregarAlunos = useCallback(async () => {
    if (!turmaId) { setAlunos([]); return; }
    try { setAlunos(await carregarTurma(turmaId)); } catch { setErro("Não foi possível carregar os alunos."); }
  }, [turmaId]);
  useEffect(() => { void recarregarAlunos(); }, [recarregarAlunos]);

  if (!supabaseConfigurado) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="cartao p-6">
          <h1 className="text-2xl font-black">Painel do professor</h1>
          <p className="mt-2 text-suave">O Supabase ainda não está configurado neste ambiente. Veja o README para ligar o projeto.</p>
        </div>
      </main>
    );
  }
  if (prof === undefined) return <main className="grid min-h-dvh place-items-center font-black text-marca">Carregando…</main>;
  if (!prof) return <Login aoEntrar={async (e, s) => {
    const r = await entrarProfessor(e, s);
    if (!r) { const p = await professorAtual(); setProf(p); if (p) await recarregarTurmas(); }
    return r;
  }} />;

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 print:max-w-none print:p-0">
      <header className="cartao flex flex-wrap items-center gap-3 p-4 print:hidden">
        <div className="mr-auto">
          <p className="rotulo">Torre Infinita · Professor</p>
          <h1 className="text-2xl font-black">{turma ? turma.nome : "Suas turmas"}</h1>
        </div>
        {turmas.length > 0 && (
          <select aria-label="Turma" value={turmaId ?? ""} onChange={(e) => { setTurmaId(e.target.value); setPins([]); }} className="h-12 rounded-xl border-2 border-linha bg-white px-3 font-bold">
            {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome} · {t.ano}º ano</option>)}
          </select>
        )}
        <span className="text-sm font-semibold text-suave">{prof.email}</span>
        <button type="button" className="btn btn-fantasma" onClick={async () => { await sairProfessor(); setProf(null); setTurmas([]); }}>Sair</button>
      </header>

      {erro && <p role="alert" className="rounded-xl bg-erro-fundo px-4 py-3 font-bold text-erro print:hidden">{erro}</p>}

      {turmas.length === 0 && (
        <NovaTurma professorId={prof.id} aoCriar={async (t) => { await recarregarTurmas(t.id); }} />
      )}

      {turma && (
        <>
          <nav className="flex flex-wrap gap-2 print:hidden" aria-label="Seções">
            {([["geral", "Visão geral"], ["habilidades", "Habilidades"], ["alunos", "Alunos e PINs"]] as const).map(([k, r]) => (
              <button key={k} type="button" aria-pressed={aba === k} onClick={() => setAba(k)}
                className={"btn " + (aba === k ? "btn-marca" : "btn-suave")}>{r}</button>
            ))}
            <button type="button" className="btn btn-fantasma ml-auto" onClick={() => void recarregarAlunos()}>Atualizar</button>
          </nav>

          {aba === "geral" && <Geral turma={turma} alunos={alunos} aoMeta={async (m) => { await atualizarMeta(turma.id, m); await recarregarTurmas(); }} />}
          {aba === "habilidades" && <Habilidades turma={turma} alunos={alunos} />}
          {aba === "alunos" && (
            <Alunos turma={turma} alunos={alunos} pins={pins}
              aoImportar={async (lista) => { const novos = await importarAlunos(turma.id, lista); setPins(novos); await recarregarAlunos(); return novos.length; }}
              aoResetar={async (a) => { const pin = await resetarPin(a.id); setPins([{ codigo: a.codigo, nome: a.nome, pin }]); }} />
          )}
          <details className="cartao p-4 print:hidden">
            <summary className="cursor-pointer font-black">Nova turma</summary>
            <div className="mt-3"><NovaTurma professorId={prof.id} semCartao aoCriar={async (t) => { await recarregarTurmas(t.id); setPins([]); }} /></div>
          </details>
        </>
      )}
    </main>
  );
}

function Login({ aoEntrar }: { aoEntrar: (email: string, senha: string) => Promise<string | null> }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [vai, setVai] = useState(false);
  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center px-4">
      <form className="cartao grid gap-4 p-6" onSubmit={async (e) => { e.preventDefault(); setVai(true); setErro(await aoEntrar(email.trim(), senha)); setVai(false); }}>
        <h1 className="text-3xl font-black">Painel do professor</h1>
        <label className="grid gap-1.5"><span className="rotulo">E-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="h-12 rounded-xl border-2 border-linha px-3 text-lg outline-none focus:border-marca" /></label>
        <label className="grid gap-1.5"><span className="rotulo">Senha</span>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" className="h-12 rounded-xl border-2 border-linha px-3 text-lg outline-none focus:border-marca" /></label>
        {erro && <p role="alert" className="rounded-xl bg-erro-fundo px-3 py-2 font-bold text-erro">{erro}</p>}
        <button type="submit" disabled={vai || !email || !senha} className="btn btn-marca">{vai ? "Entrando…" : "Entrar"}</button>
      </form>
    </main>
  );
}

function NovaTurma({ professorId, aoCriar, semCartao }: { professorId: string; aoCriar: (t: Turma) => Promise<void>; semCartao?: boolean }) {
  const [nome, setNome] = useState("");
  const [ano, setAno] = useState(6);
  const [meta, setMeta] = useState(5000);
  const [erro, setErro] = useState<string | null>(null);
  const corpo = (
    <form className="grid gap-3 sm:grid-cols-[1fr_9rem_9rem_auto] sm:items-end" onSubmit={async (e) => {
      e.preventDefault();
      setErro(null);
      try { const t = await criarTurma(professorId, nome.trim(), ano, meta); setNome(""); await aoCriar(t); }
      catch { setErro("Não foi possível criar a turma."); }
    }}>
      <label className="grid gap-1"><span className="rotulo">Nome da turma</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: 7º A" className="h-12 rounded-xl border-2 border-linha px-3 font-bold outline-none focus:border-marca" /></label>
      <label className="grid gap-1"><span className="rotulo">Ano</span>
        <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="h-12 rounded-xl border-2 border-linha bg-white px-3 font-bold">
          {[6, 7, 8, 9].map((a) => <option key={a} value={a}>{a}º ano</option>)}</select></label>
      <label className="grid gap-1"><span className="rotulo">Meta semanal</span>
        <input type="number" min={500} step={500} value={meta} onChange={(e) => setMeta(Number(e.target.value))} className="h-12 rounded-xl border-2 border-linha px-3 font-bold outline-none focus:border-marca" /></label>
      <button type="submit" disabled={!nome.trim()} className="btn btn-marca">Criar turma</button>
      {erro && <p role="alert" className="font-bold text-erro sm:col-span-4">{erro}</p>}
    </form>
  );
  return semCartao ? corpo : <section className="cartao grid gap-3 p-5"><h2 className="text-xl font-black">Crie sua primeira turma</h2>{corpo}</section>;
}

function Geral({ turma, alunos, aoMeta }: { turma: Turma; alunos: AlunoLinha[]; aoMeta: (m: number) => Promise<void> }) {
  const total = alunos.reduce((s, a) => s + a.pontosSemana, 0);
  const ativos = alunos.filter((a) => a.rodadasSemana > 0).length;
  const pct = Math.min(100, Math.round((total / turma.meta_semanal) * 100));
  const dificuldades = useMemo(() => dificuldadesDaTurma(alunos.flatMap((a) => (a.estado ? [a.estado] : []))), [alunos]);
  const atencao = alunos.map((a) => ({ a, al: alertasDoAluno(a.estado, a.ultima ?? a.atualizadoEm) })).filter((x) => x.al.length);
  const [meta, setMeta] = useState(turma.meta_semanal);
  useEffect(() => setMeta(turma.meta_semanal), [turma.meta_semanal]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="cartao grid gap-3 p-5 lg:col-span-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="rotulo">Pontos da turma nesta semana</p>
            <p className="text-4xl font-black text-marca">{pt(total)} <span className="text-lg text-suave">de {pt(turma.meta_semanal)}</span></p>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-suave">Meta
            <input type="number" min={500} step={500} value={meta} onChange={(e) => setMeta(Number(e.target.value))}
              onBlur={() => meta >= 500 && meta !== turma.meta_semanal && void aoMeta(meta)} className="h-10 w-28 rounded-xl border-2 border-linha px-2 font-bold" /></label>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-linha"><div className={"h-full rounded-full " + (pct >= 100 ? "bg-ok" : "bg-marca")} style={{ width: `${pct}%` }} /></div>
        <p className="font-semibold text-suave">{ativos} de {alunos.length} alunos jogaram esta semana.</p>
      </section>

      <section className="cartao p-5">
        <h2 className="text-xl font-black">Onde a turma mais tropeça</h2>
        {dificuldades.length === 0 ? <p className="mt-2 text-suave">Ainda não há dados suficientes. Quando os alunos jogarem, as maiores dificuldades aparecem aqui.</p> : (
          <ol className="mt-3 grid gap-2">
            {dificuldades.map((d, i) => (
              <li key={d.habilidade + d.cat} className="flex items-center gap-3 rounded-xl bg-fundo px-3 py-2">
                <span className="w-5 font-black text-suave">{i + 1}</span>
                <span className="min-w-0 flex-1"><strong>{d.rotulo}</strong><br /><span className="text-sm text-suave">{d.nome} · {d.alunos} {d.alunos === 1 ? "aluno" : "alunos"}</span></span>
                <span className="font-black text-erro">{Math.round(d.media * 100)}%</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="cartao p-5">
        <h2 className="text-xl font-black">Precisam de atenção</h2>
        {atencao.length === 0 ? <p className="mt-2 text-suave">Ninguém em alerta agora.</p> : (
          <ul className="mt-3 grid gap-2">
            {atencao.map(({ a, al }) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-fundo px-3 py-2">
                <strong className="truncate">{a.nome}</strong>
                <span className="text-right text-sm font-bold text-ouro">{al.map((x) => ROTULO_ALERTA[x]).join(" · ")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cartao overflow-x-auto p-5 lg:col-span-2">
        <h2 className="mb-3 text-xl font-black">Alunos</h2>
        <table className="w-full min-w-[40rem] text-left">
          <thead><tr className="rotulo"><th className="py-2">Aluno</th><th>Nível</th><th>Andar</th><th>Acerto</th><th>Pontos (semana)</th><th>Minutos</th><th>Última vez</th></tr></thead>
          <tbody>
            {[...alunos].sort((a, b) => b.pontosSemana - a.pontosSemana).map((a) => (
              <tr key={a.id} className="border-t-2 border-linha">
                <td className="py-2 font-bold">{a.nome}{a.apelido && <span className="ml-2 text-sm font-semibold text-suave">({a.apelido})</span>}</td>
                <td>{a.estado?.nivel ?? "—"}</td>
                <td>{a.estado?.andar ?? "—"}</td>
                <td>{a.estado?.respondidas ? `${Math.round((a.estado.acertos / a.estado.respondidas) * 100)}%` : "—"}</td>
                <td className="font-black text-ouro">{pt(a.pontosSemana)}</td>
                <td>{a.minutosSemana}</td>
                <td className="text-sm text-suave">{quando(a.ultima ?? a.atualizadoEm)}</td>
              </tr>
            ))}
            {alunos.length === 0 && <tr><td colSpan={7} className="py-4 text-suave">Nenhum aluno ainda. Importe a lista na aba “Alunos e PINs”.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Habilidades({ turma, alunos }: { turma: Turma; alunos: AlunoLinha[] }) {
  const hs = HABILIDADES.filter((h) => h.ano <= turma.ano);
  return (
    <section className="cartao overflow-x-auto p-5">
      <h2 className="text-xl font-black">Domínio por habilidade</h2>
      <p className="mb-3 mt-1 flex flex-wrap items-center gap-3 text-sm font-semibold text-suave">
        {[["bg-erro", "frágil"], ["bg-[#f5b400]", "em treino"], ["bg-[#7bd389]", "consolidando"], ["bg-ok", "dominada"], ["border-2 border-dashed border-marca/40 bg-white", "sem dados"], ["bg-linha", "bloqueada"]].map(([c, r]) => (
          <span key={r} className="flex items-center gap-1.5"><span className={"inline-block size-4 rounded " + c} />{r}</span>
        ))}
      </p>
      <table className="border-separate border-spacing-1">
        <thead>
          <tr>
            <th />
            {hs.map((h) => (
              <th key={h.id} className="h-40 w-8 align-bottom text-xs font-bold text-suave"><span className="inline-block [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">{h.nome}</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alunos.map((a) => (
            <tr key={a.id}>
              <th className="pr-3 text-right text-sm font-bold whitespace-nowrap">{a.nome}</th>
              {hs.map((h) => {
                const c = celulaDoMapa(a.estado, h.id);
                const txt = `${a.nome}: ${h.nome}, ${c.d === null ? c.situacao : Math.round(c.d * 100) + "%"}`;
                return <td key={h.id}><span title={txt} aria-label={txt} role="img" className={"block size-8 rounded-md " + COR_CELULA(c.d, c.situacao)} /></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {alunos.length === 0 && <p className="text-suave">Nenhum aluno na turma ainda.</p>}
    </section>
  );
}

function Alunos({ turma, alunos, pins, aoImportar, aoResetar }: {
  turma: Turma; alunos: AlunoLinha[]; pins: PinNovo[];
  aoImportar: (l: { codigo: string; nome: string }[]) => Promise<number>;
  aoResetar: (a: AlunoLinha) => Promise<void>;
}) {
  const [texto, setTexto] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const lista = lerLista(texto);
  return (
    <div className="grid gap-5">
      <section className="cartao grid gap-3 p-5 print:hidden">
        <h2 className="text-xl font-black">Importar alunos</h2>
        <p className="text-suave">Cole uma linha por aluno: <code>código;nome</code>. Cada aluno novo recebe um PIN de 4 números, mostrado uma única vez abaixo, para você imprimir.</p>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={6} placeholder={"e2700573;Ana Souza\ne2700574;Bruno Lima"}
          className="rounded-xl border-2 border-linha p-3 font-mono text-base outline-none focus:border-marca" />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-marca" disabled={!lista.length} onClick={async () => {
            setMsg(null);
            try { const n = await aoImportar(lista); setMsg(`${n} aluno(s) novo(s) criado(s). ${lista.length - n} já existiam e só tiveram o nome atualizado.`); setTexto(""); }
            catch (e) { setMsg(String((e as Error).message).includes("codigo-em-uso") ? "Um dos códigos já pertence a outra turma." : "Não foi possível importar."); }
          }}>Importar {lista.length ? `${lista.length} aluno(s)` : ""}</button>
          {msg && <span role="status" className="font-bold text-marca">{msg}</span>}
        </div>
      </section>

      {pins.length > 0 && (
        <section className="cartao p-5 print:border-0 print:shadow-none">
          <div className="mb-3 flex items-center justify-between print:hidden">
            <h2 className="text-xl font-black">Cartões de acesso · {turma.nome}</h2>
            <button type="button" className="btn btn-suave" onClick={() => window.print()}>Imprimir</button>
          </div>
          <p className="mb-3 text-sm font-bold text-erro print:hidden">Estes PINs aparecem só agora. Imprima ou anote antes de sair desta tela.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
            {pins.map((p) => (
              <div key={p.codigo} className="break-inside-avoid rounded-xl border-2 border-dashed border-linha p-3">
                <p className="font-black">{p.nome}</p>
                <p className="text-sm text-suave">Turma {turma.nome}</p>
                <p className="mt-2">Código: <strong className="font-mono text-lg">{p.codigo}</strong></p>
                <p>PIN: <strong className="font-mono text-2xl tracking-widest">{p.pin}</strong></p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="cartao overflow-x-auto p-5 print:hidden">
        <h2 className="mb-3 text-xl font-black">{alunos.length} alunos na turma</h2>
        <table className="w-full min-w-[32rem] text-left">
          <thead><tr className="rotulo"><th className="py-2">Nome</th><th>Código</th><th>Apelido</th><th /></tr></thead>
          <tbody>
            {alunos.map((a) => (
              <tr key={a.id} className="border-t-2 border-linha">
                <td className="py-2 font-bold">{a.nome}</td><td className="font-mono">{a.codigo}</td><td>{a.apelido ?? "—"}</td>
                <td className="text-right"><button type="button" className="btn btn-fantasma min-h-9 text-sm" onClick={() => void aoResetar(a)}>Novo PIN</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
