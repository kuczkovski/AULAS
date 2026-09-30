"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { ContextoProfessor } from "@/components/ContextoProfessor";
import { TURMAS } from "@/dominio/questoes";
import { construirBase, filtrarTurma, type Base } from "@/lib/analise";
import {
  carregarDados, carregarGabarito, entrarProfessor, gerarDemonstracao, modoLocal, sairProfessor,
  situacaoProfessor, type SituacaoProfessor,
} from "@/lib/professor";

const ABAS = [
  { href: "/professor", rotulo: "Visão geral" },
  { href: "/professor/turmas", rotulo: "Turmas" },
  { href: "/professor/alunos", rotulo: "Alunos" },
  { href: "/professor/questoes", rotulo: "Questões" },
  { href: "/professor/habilidades", rotulo: "Habilidades" },
];

export default function LayoutProfessor({ children }: { children: React.ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const [situacao, setSituacao] = useState<SituacaoProfessor>("carregando");
  const [email, setEmail] = useState<string>();
  const [base, setBase] = useState<Base | null>(null);
  const [gabarito, setGabarito] = useState<Record<string, string>>({});
  const [turma, setTurma] = useState("todas");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [dados, gab] = await Promise.all([carregarDados(), carregarGabarito()]);
      setBase(construirBase(dados));
      setGabarito(gab);
    } catch {
      setErro("Não foi possível carregar os dados agora. Verifique a conexão e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }, []);

  const verificar = useCallback(async () => {
    try {
      const r = await situacaoProfessor();
      setSituacao(r.situacao);
      setEmail(r.email);
      if (r.situacao === "ok") await recarregar();
    } catch {
      setSituacao("sem-login");
      setErro("Não foi possível verificar o acesso. Tente de novo.");
    }
  }, [recarregar]);

  useEffect(() => { verificar(); }, [verificar]);

  const alunos = useMemo(() => (base ? filtrarTurma(base.alunos, turma) : []), [base, turma]);

  if (situacao === "carregando") return <><Cabecalho /><p className="p-8 text-center text-suave" role="status">Carregando…</p></>;
  if (situacao !== "ok") return <Login situacao={situacao} email={email} erroInicial={erro} aoEntrar={verificar} />;

  return (
    <>
      <Cabecalho direita={
        <div className="flex items-center gap-3 text-sm">
          {!modoLocal && <span className="hidden text-suave sm:inline">{email}</span>}
          {!modoLocal && <button className="botao botao-claro !min-h-10 !px-4" onClick={async () => { await sairProfessor(); setBase(null); setSituacao("sem-login"); }}>Sair</button>}
        </div>
      } />
      <div className="mx-auto max-w-6xl px-4 py-5">
        {modoLocal && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-aten-fundo p-3 text-sm text-aten">
            <p className="flex-1">Modo local de demonstração: sem login e com dados só deste navegador. Em produção o painel exige autenticação.</p>
            <button className="botao botao-claro !min-h-10 !px-4 text-sm" onClick={async () => { await gerarDemonstracao(); await recarregar(); }}>Gerar dados de demonstração</button>
          </div>
        )}
        <div className="nao-imprimir flex flex-wrap items-end justify-between gap-4">
          <nav aria-label="Seções do painel" className="flex flex-wrap gap-1">
            {ABAS.map(a => (
              <Link key={a.href} href={a.href} aria-current={pathname === a.href ? "page" : undefined}
                className={`rounded-lg px-4 py-2 font-semibold ${pathname === a.href ? "bg-marca text-white" : "text-suave hover:bg-marca-clara"}`}>
                {a.rotulo}
              </Link>
            ))}
          </nav>
          <div className="flex items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-suave">Turma</span>
              <select className="campo !min-h-11 !w-auto" value={turma} onChange={e => setTurma(e.target.value)}>
                <option value="todas">Todas</option>
                {TURMAS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <button className="botao botao-claro !min-h-11 !px-4" disabled={carregando} onClick={recarregar}>{carregando ? "Atualizando…" : "Atualizar"}</button>
          </div>
        </div>

        <main className="mt-6">
          {erro && <p role="alert" className="mb-4 rounded-lg bg-alerta-fundo p-3 text-alerta">{erro}</p>}
          {!base ? <p className="text-suave" role="status">Carregando dados…</p> : (
            <ContextoProfessor.Provider value={{ base, alunos, turma, gabarito, recarregar }}>
              {children}
            </ContextoProfessor.Provider>
          )}
        </main>
      </div>
    </>
  );
}

function Login({ situacao, email, erroInicial, aoEntrar }: { situacao: SituacaoProfessor; email?: string; erroInicial: string; aoEntrar: () => void }) {
  const [mail, setMail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(erroInicial);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setErro("");
    const r = await entrarProfessor(mail, senha).catch(() => "Não foi possível entrar agora. Tente de novo.");
    setOcupado(false);
    if (r) return setErro(r);
    aoEntrar();
  }

  return (
    <>
      <Cabecalho />
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-bold">Área do professor</h1>
        {situacao === "nao-autorizado" ? (
          <div className="mt-4 space-y-4">
            <p role="alert" className="rounded-lg bg-alerta-fundo p-3 text-alerta">A conta {email} não está autorizada a ver os resultados.</p>
            <button className="botao botao-claro" onClick={async () => { await sairProfessor(); aoEntrar(); }}>Sair e usar outra conta</button>
          </div>
        ) : (
          <form onSubmit={enviar} className="cartao mt-4 space-y-4 p-5">
            <div>
              <label htmlFor="email" className="mb-2 block font-semibold">E-mail</label>
              <input id="email" type="email" className="campo" autoComplete="username" value={mail} onChange={e => setMail(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="senha" className="mb-2 block font-semibold">Senha</label>
              <input id="senha" type="password" className="campo" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required />
            </div>
            {erro && <p role="alert" className="rounded-lg bg-alerta-fundo p-3 text-alerta">{erro}</p>}
            <button className="botao w-full" disabled={ocupado}>{ocupado ? "Entrando…" : "Entrar"}</button>
          </form>
        )}
      </main>
    </>
  );
}
