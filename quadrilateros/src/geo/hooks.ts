import { useEffect, useRef, useState } from 'react'

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Anima suavemente um valor numérico até `target`. Ao montar, começa já no alvo
 * (entrar em uma tela numa etapa avançada não reproduz as animações anteriores).
 */
export function useTween(target: number, ms = 1100): number {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  const cur = useRef(target)
  useEffect(() => {
    if (cur.current === target) return
    from.current = cur.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const v = from.current + (target - from.current) * ease(t)
      cur.current = v
      setValue(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return value
}

/** Retorna 0 ou 1 animado conforme a condição. */
export const useMorph = (on: boolean, ms?: number) => useTween(on ? 1 : 0, ms)
