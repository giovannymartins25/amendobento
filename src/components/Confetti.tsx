import { useEffect, useState } from "react";

const COLORS = ["#E8B82A", "#F4D561", "#A88318", "#F2EAD8", "#C73E1D"];

export function Confetti({ count = 60, durationMs = 3200 }: { count?: number; durationMs?: number }) {
  const [pieces, setPieces] = useState<{ left: number; delay: number; color: string; dur: number; w: number; h: number }[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        dur: (durationMs / 1000) * (0.7 + Math.random() * 0.6),
        w: 4 + Math.random() * 6,
        h: 8 + Math.random() * 8,
      })),
    );
  }, [count, durationMs]);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: `${p.w}px`,
            height: `${p.h}px`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.dur}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}