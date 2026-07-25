import type { Player } from '@plate-game/shared';
import styles from './PlayerList.module.css';

interface PlayerListProps {
  players: Player[];
  hostId: string;
}

export function PlayerList({ players, hostId }: PlayerListProps) {
  return (
    <ul className={styles.list}>
      {players.map((player, index) => (
        <li
          key={player.id}
          className={`${styles.row} ${styles.fadeIn}`}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <span className={styles.name}>
            {player.nickname}
            {player.id === hostId && <span className={styles.crown} aria-label="Host">👑</span>}
          </span>
          {!player.connected && <span className={styles.offline}>offline</span>}
        </li>
      ))}
    </ul>
  );
}
