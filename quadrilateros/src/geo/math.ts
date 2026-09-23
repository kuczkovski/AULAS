// Utilitários de geometria plana (coordenadas de tela: y cresce para baixo).

export interface Pt {
  x: number
  y: number
}

export const P = (x: number, y: number): Pt => ({ x, y })
export const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y })
export const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k })
export const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y
export const cross = (a: Pt, b: Pt) => a.x * b.y - a.y * b.x
export const len = (a: Pt) => Math.hypot(a.x, a.y)
export const dist = (a: Pt, b: Pt) => len(sub(a, b))
export const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
export const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
export const lerpN = (a: number, b: number, t: number) => a + (b - a) * t
export const unit = (a: Pt): Pt => {
  const l = len(a) || 1
  return { x: a.x / l, y: a.y / l }
}
/** Vetor perpendicular (rotação de 90°). */
export const perp = (a: Pt): Pt => ({ x: -a.y, y: a.x })
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const deg = (rad: number) => (rad * 180) / Math.PI
export const rad = (d: number) => (d * Math.PI) / 180

/** Ponto na direção de um ângulo (graus, medido no sentido anti-horário visual, a partir do eixo x). */
export const polar = (c: Pt, r: number, angDeg: number): Pt => ({
  x: c.x + r * Math.cos(rad(angDeg)),
  y: c.y - r * Math.sin(rad(angDeg)),
})

/** Direção (graus, anti-horário visual) do vetor de a para b. */
export const heading = (a: Pt, b: Pt) => deg(Math.atan2(-(b.y - a.y), b.x - a.x))

/** Medida (0–180°) do ângulo AVB. */
export const angleAt = (v: Pt, a: Pt, b: Pt) => {
  const u = sub(a, v)
  const w = sub(b, v)
  const c = dot(u, w) / ((len(u) || 1) * (len(w) || 1))
  return deg(Math.acos(clamp(c, -1, 1)))
}

/** Interseção das retas p1+t·d1 e p2+s·d2 (null se paralelas). */
export const intersect = (p1: Pt, d1: Pt, p2: Pt, d2: Pt): Pt | null => {
  const den = cross(d1, d2)
  if (Math.abs(den) < 1e-9) return null
  const t = cross(sub(p2, p1), d2) / den
  return add(p1, mul(d1, t))
}

/** Interseção das retas AB e CD. */
export const intersectLines = (a: Pt, b: Pt, c: Pt, d: Pt) => intersect(a, sub(b, a), c, sub(d, c))

/** Projeção ortogonal de p sobre a reta AB. */
export const project = (p: Pt, a: Pt, b: Pt): Pt => {
  const d = sub(b, a)
  const t = dot(sub(p, a), d) / (dot(d, d) || 1)
  return add(a, mul(d, t))
}

export const centroid = (pts: Pt[]): Pt => {
  const s = pts.reduce((acc, p) => add(acc, p), P(0, 0))
  return mul(s, 1 / pts.length)
}

/** Verifica se o polígono (na ordem dada) é convexo e não degenerado. */
export const isConvex = (pts: Pt[], minAngle = 12) => {
  const n = pts.length
  let sign = 0
  for (let i = 0; i < n; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    const c = pts[(i + 2) % n]
    const z = cross(sub(b, a), sub(c, b))
    if (Math.abs(z) < 1e-6) return false
    const s = Math.sign(z)
    if (sign === 0) sign = s
    else if (s !== sign) return false
    const ang = angleAt(b, a, c)
    if (ang < minAngle || ang > 180 - minAngle / 2) return false
  }
  return true
}

/** Mantém o ponto dentro de uma caixa. */
export const clampPt = (p: Pt, x0: number, y0: number, x1: number, y1: number): Pt => ({
  x: clamp(p.x, x0, x1),
  y: clamp(p.y, y0, y1),
})

/**
 * Arredonda valores inteiros de forma que a soma seja exatamente `total`
 * (método dos maiores restos) — evita exibir 359° ou 361° em somas de ângulos.
 */
export const roundToSum = (values: number[], total: number): number[] => {
  const floors = values.map(Math.floor)
  let rest = total - floors.reduce((a, b) => a + b, 0)
  const order = values
    .map((v, i) => ({ i, r: v - Math.floor(v) }))
    .sort((a, b) => b.r - a.r)
  const out = [...floors]
  for (const { i } of order) {
    if (rest <= 0) break
    out[i] += 1
    rest -= 1
  }
  return out
}

/** Ângulos internos de um polígono. */
export const polyAngles = (pts: Pt[]) =>
  pts.map((p, i) => angleAt(p, pts[(i + pts.length - 1) % pts.length], pts[(i + 1) % pts.length]))

/** Formata número em pt-BR com até `d` casas decimais. */
export const fmt = (v: number, d = 1) => {
  const r = Math.round(v * 10 ** d) / 10 ** d
  return r.toLocaleString('pt-BR', { maximumFractionDigits: d })
}

/**
 * Constrói um quadrilátero ABCD (A embaixo à esquerda, B à direita, C e D em cima)
 * com ângulos internos Â e B̂ dados, lado AB e lado AD, e ângulo Ĉ dado.
 */
export const quadFromAngles = (A: Pt, ab: number, ad: number, angA: number, angB: number, angC: number): Pt[] => {
  const B = add(A, P(ab, 0))
  const D = polar(A, ad, angA)
  const dirB = polar(P(0, 0), 1, 180 - angB)
  // Direção de D para C: rumo (180 − B − C) no percurso A→B→C→D.
  const dirD = polar(P(0, 0), 1, 180 - angB - angC + 180)
  const C = intersect(B, dirB, D, mul(dirD, -1)) ?? mid(B, D)
  return [A, B, C, D]
}

/** Triângulo com base AB horizontal e ângulos Â e B̂ dados (C acima da base). */
export const triFromAngles = (A: Pt, ab: number, angA: number, angB: number): Pt[] => {
  const B = add(A, P(ab, 0))
  const C = intersect(A, polar(P(0, 0), 1, angA), B, polar(P(0, 0), 1, 180 - angB)) ?? mid(A, B)
  return [A, B, C]
}
