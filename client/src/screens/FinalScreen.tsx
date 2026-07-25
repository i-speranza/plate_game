import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const winners = snapshot.players.filter((p) => snapshot.winners.includes(p.id));
  const winnerNames = winners.map((w) => w.nickname).join(' & ') || '—';

  return (
    <div className="screen">
      <div className={styles.trophy}>🏆</div>
      <h1 className={styles.winner}>{winnerNames}</h1>
      <p className={styles.winnerLabel}>
        {winners.length > 1 ? t('final.winners') : winners.length === 1 ? t('final.winner') : t('final.gameOver')}
      </p>

      <Leaderboard title={t('final.finalStandings')} entries={snapshot.cumulativeLeaderboard} highlightId={playerId ?? undefined} />

      <button className="text-link" onClick={() => setExpanded(!expanded)}>
        {expanded ? t('final.hideBreakdown') : t('final.showBreakdown')}
      </button>

      {expanded && (
        <div className={styles.breakdown}>
          {snapshot.roundResults.map((round) => (
            <div key={round.roundNumber} className="card">
              <h3>{t('final.roundTitle', { round: round.roundNumber })}</h3>
              <p className={styles.letters}>{round.letters.join(' ')}</p>
              <ul className={styles.roundScores}>
                {snapshot.players.map((p) => (
                  <li key={p.id}>
                    {round.submissions[p.id]
                      ? t('final.roundScoreLine', {
                          nickname: p.nickname,
                          score: round.roundScores[p.id] ?? 0,
                          word: round.submissions[p.id]!.word,
                        })
                      : `${p.nickname}: ${round.roundScores[p.id] ?? 0}`}
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
            {t('final.playAgain')}
          </button>
        )}
        <button className="btn btn-secondary" onClick={onLeave}>
          {t('final.leave')}
        </button>
      </div>
    </div>
  );
}
