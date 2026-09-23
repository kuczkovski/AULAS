import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export const STAGE_W = 1920
export const STAGE_H = 1080

/**
 * Palco 16:9 com resolução de referência 1920×1080, escalado para caber
 * inteiro no espaço disponível (sem cortes e sem barras de rolagem).
 */
export function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  useLayoutEffect(() => {
    const el = ref.current!
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      setScale(Math.max(0.1, Math.min(width / STAGE_W, height / STAGE_H)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="relative shrink-0" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div
          className="stage absolute left-0 top-0"
          style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: '0 0' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
