// Roteiro do professor para impressão: alternativa ao painel do professor quando
// o tablet está espelhado no projetor (tudo o que aparece no tablet é projetado).
import { Printer } from 'lucide-react'
import { BLOCKS, SCREENS } from '../lesson/lesson'

export function Roteiro() {
  let acc = 0
  return (
    <div className="roteiro mx-auto max-w-4xl bg-white p-8 text-slate-800">
      <div className="no-print mb-6 flex items-center gap-3">
        <button className="btn-primary" onClick={() => window.print()}>
          <Printer size={20} /> Imprimir / salvar PDF
        </button>
        <a className="btn-ghost" href="#">
          Voltar para a aula
        </a>
      </div>
      <h1 className="font-comic text-5xl text-green-800">Geometria em Quadrinhos — Quadriláteros notáveis</h1>
      <p className="mt-1 text-lg">Roteiro do professor · aula de 50 minutos</p>
      <table className="mt-4 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-slate-400">
            <th className="py-1">Bloco</th>
            <th>Conteúdo</th>
            <th>Duração</th>
          </tr>
        </thead>
        <tbody>
          {BLOCKS.map((b) => (
            <tr key={b.id} className="border-b border-slate-200">
              <td className="py-1 font-bold">{b.id}</td>
              <td>{b.title}</td>
              <td>{b.minutes} min</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-sm text-slate-600">
        Teclado: → / espaço / PageDown avançam; ← / PageUp voltam; Shift+setas trocam de tela; M menu; R reiniciar; A anotar; P
        painel do professor; F tela cheia.
      </p>

      {BLOCKS.map((b) => (
        <section key={b.id} className="mt-8">
          <h2 className="rounded-lg px-3 py-1 text-2xl font-extrabold text-white" style={{ background: b.color }}>
            Bloco {b.id} — {b.title} ({b.minutes} min)
          </h2>
          <p className="mt-1 text-sm italic">{b.goal}</p>
          {SCREENS.filter((s) => s.block === b.id).map((s) => {
            const start = acc
            acc += s.minutes
            const n = s.notes
            return (
              <article key={s.id} className="mt-4 break-inside-avoid border-l-4 pl-3" style={{ borderColor: b.color }}>
                <h3 className="text-lg font-extrabold">
                  {s.num > 0 && s.block < 4 ? `Tela ${s.num} — ` : ''}
                  {s.title}{' '}
                  <span className="text-sm font-semibold text-slate-500">
                    ({String(s.minutes).replace('.', ',')} min · início ≈ {String(Math.round(start * 10) / 10).replace('.', ',')} min)
                  </span>
                </h3>
                <p className="text-sm">
                  <b>Objetivo:</b> {n.objetivo}
                </p>
                <p className="mt-1 text-sm font-bold">Sequência de toques:</p>
                <ol className="ml-5 list-decimal text-sm">
                  {s.steps.map((st, i) => (
                    <li key={i} value={i}>
                      {st}
                    </li>
                  ))}
                </ol>
                <Row label="Conhecimentos prévios" items={n.previos} />
                <Row label="Orientações" items={n.orientacoes} />
                <Row label="Perguntas" items={n.perguntas} />
                <Row label="Justificativa" items={n.justificativa} />
                <Row label="Dificuldades" items={n.dificuldades} />
                <Row label="Avaliação" items={[n.avaliacao]} />
              </article>
            )
          })}
        </section>
      ))}
    </div>
  )
}

function Row({ label, items }: { label: string; items: string[] }) {
  return (
    <p className="mt-1 text-sm">
      <b>{label}:</b> {items.join(' ')}
    </p>
  )
}
