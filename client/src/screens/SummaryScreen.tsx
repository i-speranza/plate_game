import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player, RoundResult, SessionSnapshot } from '@plate-game/shared';
import { PlateTile } from '../components/PlateTile';
import { Leaderboard } from '../components/Leaderboard';
import styles from './SummaryScreen.module.css';

interface SummaryScreenProps {
  snapshot: SessionSnapshot;
  isHost: boolean;
  playerId: string | null;
  onNext: () => void;
  onEnd: () => void;
}

function getBestSubmission(result: RoundResult, players: Player[]) {
  let best: { player: Player; word: string; score: number } | null = null;
  for (const player of players) {
    const sub = result.submissions[player.id];
    if (sub && (!best || sub.score > best.score)) {
      best = { player, word: sub.word, score: sub.score };
    }
  }
  return best;
}

export function SummaryScreen({ snapshot, isHost, playerId, onNext, onEnd }: SummaryScreenProps) {
  const { t } = useTranslation();
  const latestResult = snapshot.roundResults[snapshot.roundResults.length - 1];
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!latestResult) return;
    const subs = snapshot.players
      .map((p) => ({ player: p, sub: latestResult.submissions[p.id] }))
      .filter((x) => x.sub)
      .sort((a, b) => (b.sub!.score - a.sub!.score));

    setRevealed(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealed(i);
      if (i >= subs.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, [latestResult, snapshot.players]);

  if (!latestResult) return null;

  const best = getBestSubmission(latestResult, snapshot.players);
  const subs = snapshot.players
    .map((p) => ({ player: p, sub: latestResult.submissions[p.id] }))
    .filter((x) => x.sub)
    .sort((a, b) => b.sub!.score - a.sub!.score);

  const isFinalRound = snapshot.currentRound >= snapshot.totalRounds;

  return (
    <div className="screen">
      <h2>{t('summary.roundResults', { round: latestResult.roundNumber })}</h2>

      {best && (
        <div className={styles.winnerCard}>
          <PlateTile text={latestResult.letters.join(' ')} />
          <p className={styles.bestWord}>{best.word}</p>
          <p className={styles.bestMeta}>
            {t('summary.bestMeta', { nickname: best.player.nickname, score: best.score })}
          </p>
        </div>
      )}

      <div className={styles.submissions}>
        {subs.slice(0, revealed).map(({ player, sub }) => (
          <div key={player.id} className={`card ${styles.subCard}`}>
            <span className={styles.subName}>{player.nickname}</span>
            <span className={styles.subWord}>{sub!.word}</span>
            <span className={styles.subScore}>{sub!.score}</span>
          </div>
        ))}
      </div>

      <Leaderboard title={t('summary.roundScores')} entries={snapshot.roundLeaderboard} highlightId={playerId ?? undefined} />
      <Leaderboard title={t('summary.totalScores')} entries={snapshot.cumulativeLeaderboard} highlightId={playerId ?? undefined} />

      {latestResult.revealedSolution && (
        <div className={styles.solutionCard}>
          <p className={styles.solutionLabel}>
            {t('summary.possibleSolution', { count: snapshot.settings.letterCount })}
          </p>
          <p className={styles.solutionWord}>{latestResult.revealedSolution}</p>
        </div>
      )}

      {latestResult.noOrderedSolution && (
        <p className={styles.noOrderedSolution}>
          {t('summary.noOrderedSolution', { count: snapshot.settings.letterCount })}
        </p>
      )}

      {isHost ? (
        <div className={styles.hostActions}>
          {!isFinalRound && (
            <button className="btn btn-primary" onClick={onNext}>
              {t('summary.nextRound')}
            </button>
          )}
          <button className="btn btn-secondary" onClick={isFinalRound ? onNext : onEnd}>
            {isFinalRound ? t('summary.viewFinalResults') : t('summary.endGame')}
          </button>
        </div>
      ) : (
        <p className="waiting-text">{t('common.waitingForHost')}</p>
      )}
    </div>
  );
}
