import { useEffect, useState } from 'react';
import styles from './TimerBar.module.css';

interface TimerBarProps {
  remainingMs: number | null;
  durationMs: number;
}

export function TimerBar({ remainingMs, durationMs }: TimerBarProps) {
  const [displayMs, setDisplayMs] = useState(remainingMs ?? durationMs);

  useEffect(() => {
    if (remainingMs === null) return;
    setDisplayMs(remainingMs);

    const interval = setInterval(() => {
      setDisplayMs((prev) => Math.max(0, prev - 100));
    }, 100);

    return () => clearInterval(interval);
  }, [remainingMs]);

  const progress = durationMs > 0 ? displayMs / durationMs : 0;
  const seconds = Math.ceil(displayMs / 1000);
  const isUrgent = progress <= 0.2;
  const isCritical = seconds <= 10;

  let barClass = styles.bar;
  if (isCritical) barClass += ` ${styles.critical}`;
  else if (isUrgent) barClass += ` ${styles.urgent}`;

  return (
    <div className={styles.container}>
      <div className={styles.track}>
        <div className={barClass} style={{ width: `${progress * 100}%` }} />
      </div>
      <div className={`${styles.timer} ${isCritical ? styles.timerCritical : ''}`}>
        {seconds}s
      </div>
    </div>
  );
}
