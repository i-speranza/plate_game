import type { LeaderboardEntry } from '@plate-game/shared';
import styles from './Leaderboard.module.css';

interface LeaderboardProps {
  title: string;
  entries: LeaderboardEntry[];
  highlightId?: string;
}

export function Leaderboard({ title, entries, highlightId }: LeaderboardProps) {
  return (
    <div className={styles.board}>
      <h3>{title}</h3>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li
            key={entry.playerId}
            className={`${styles.row} ${entry.playerId === highlightId ? styles.highlight : ''}`}
          >
            <span className={styles.rank}>#{entry.rank}</span>
            <span className={styles.name}>{entry.nickname}</span>
            <span className={styles.score}>{entry.score}</span>
            {entry.rankChange !== undefined && entry.rankChange !== 0 && (
              <span className={entry.rankChange > 0 ? styles.up : styles.down}>
                {entry.rankChange > 0 ? `↑${entry.rankChange}` : `↓${Math.abs(entry.rankChange)}`}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
