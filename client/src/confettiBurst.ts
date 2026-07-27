import confetti from 'canvas-confetti';

export function fireConfettiBurst(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const count = 120;
  const defaults = {
    origin: { y: 0.55 },
    zIndex: 1000,
  };

  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.4),
    spread: 55,
    startVelocity: 45,
  });

  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.3),
    spread: 80,
    startVelocity: 35,
    scalar: 0.9,
  });

  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.3),
    spread: 100,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.1,
  });
}
