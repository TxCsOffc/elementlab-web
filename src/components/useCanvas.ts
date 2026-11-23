import {useEffect, useRef} from 'react';

export type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => void;

/** Холст с учётом плотности пикселей и размера контейнера; animate — перерисовка каждый кадр */
export function useCanvas(draw: DrawFn, deps: unknown[], animate = false) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0, alive = true;
    const paint = (time: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      drawRef.current(ctx, w, h, time);
    };
    const loop = (t: number) => { if (!alive) return; paint(t); raf = requestAnimationFrame(loop); };
    if (animate) raf = requestAnimationFrame(loop); else paint(performance.now());
    const ro = new ResizeObserver(() => { if (!animate) paint(performance.now()); });
    ro.observe(canvas);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, ...deps]);

  return ref;
}
