export function Particles({ count = 14 }: { count?: number }) {
  const arr = Array.from({ length: count });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {arr.map((_, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 8}s`,
            opacity: 0.4 + Math.random() * 0.4,
          }}
        />
      ))}
    </div>
  );
}