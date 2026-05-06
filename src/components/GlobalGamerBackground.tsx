import { useEffect, useRef } from 'react';

export default function GlobalGamerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: { x: number; y: number; vx: number; vy: number; s: number; a: number }[] = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles.length = 0;
      const count = window.innerWidth < 768 ? 18 : 36;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.14,
          vy: (Math.random() - 0.5) * 0.18,
          s: Math.random() * 1.8 + 0.6,
          a: Math.random() * 0.3 + 0.1,
        });
      }
    };

    const drawGrid = (t: number) => {
      const step = window.innerWidth < 768 ? 56 : 72;
      const yOffset = (t * 0.015) % step;
      ctx.strokeStyle = 'rgba(32, 227, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = -step; y <= canvas.height + step; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + yOffset);
        ctx.lineTo(canvas.width, y + yOffset);
        ctx.stroke();
      }
    };

    const animate = (now: number) => {
      if (document.hidden) {
        raf = requestAnimationFrame(animate);
        return;
      }
      if (now - last < 1000 / 30) {
        raf = requestAnimationFrame(animate);
        return;
      }
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(now);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(163, 92, 255, ${p.a * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(32, 227, 255, ${p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(32,227,255,0.19),transparent_36%),radial-gradient(circle_at_82%_6%,rgba(163,92,255,0.16),transparent_42%),linear-gradient(150deg,rgba(7,11,23,0.96),rgba(9,12,26,0.93),rgba(5,9,18,0.97))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_0%,rgba(4,8,16,0.32)_62%,rgba(2,5,10,0.82)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-75" />
    </div>
  );
}
