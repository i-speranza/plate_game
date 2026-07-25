import { useState } from 'react';
import type { SessionSnapshot } from '@plate-game/shared';
import { Leaderboard } from '../components/Leaderboard';
import styles from './FinalScreen.module.css';

interface FinalScreenProps {
  snapshot: SessionSnapshot;
  isHost: boolean;
  playerId: string | null;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export function FinalScreen({ snapshot, isHost, playerId, onPlayAgain, onLeave }: FinalScreenProps) {
  const [expanded, setExpanded] = useState(false);

  const winners = snapshot.players.filter((p) => snapshot.winners.includes(p.id));
  const winnerNames = winners.map((w) => w.nickname).join(' & ') || '—';

  return (
    <div className="screen">
      <div className={styles.trophy}>🏆</div>
      <h1 className={styles.winner}>{winnerNames}</h1>
      <p className={styles.winnerLabel}>
        {winners.length > 1 ? 'Winners!' : winners.length === 1 ? 'Winner!' : 'Game Over'}
      </p>

      <Leaderboard title="Final standings" entries={snapshot.cumulativeLeaderboard} highlightId={playerId ?? undefined} />

      <button className="text-link" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Hide' : 'Show'} round breakdown
      </button>

      {expanded && (
        <div className={styles.breakdown}>
          {snapshot.roundResults.map((round) => (
            <div key={round.roundNumber} className="card">
              <h3>Round {round.roundNumber}</h3>
              <p className={styles.letters}>{round.letters.join(' ')}</p>
              <ul className={styles.roundScores}>
                {snapshot.players.map((p) => (
                  <li key={p.id}>
                    {p.nickname}: {round.roundScores[p.id] ?? 0}
                    {round.submissions[p.id] && (
                      <span className={styles.word}> ({round.submissions[p.id]!.word})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        {isHost && (
          <button className="btn btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        )}
        <button className="btn btn-secondary" onClick={onLeave}>
          Leave
        </button>
      </div>
    </div>
  );
}
