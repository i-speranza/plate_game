import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SubmitResult } from '@plate-game/shared';
import { PlateTile } from '../components/PlateTile';
import { TimerBar } from '../components/TimerBar';
import { translateError } from '../translateError.ts';
import styles from './RoundScreen.module.css';

interface RoundScreenProps {
  letters: string[];
  roundNumber: number;
  totalRounds: number;
  durationMs: number;
  remainingMs: number | null;
  gaveUp: boolean;
  submitResult: SubmitResult | null;
  onSubmit: (word: string) => void;
  onGiveUp: () => void;
  onClearFeedback: () => void;
}

export function RoundScreen({
  letters,
  roundNumber,
  totalRounds,
  durationMs,
  remainingMs,
  gaveUp,
  submitResult,
  onSubmit,
  onGiveUp,
  onClearFeedback,
}: RoundScreenProps) {
  const { t } = useTranslation();
  const [word, setWord] = useState('');
  const [flash, setFlash] = useState<'success' | 'error' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!submitResult) return;

    if (submitResult.valid) {
      setFlash('success');
      setWord('');
      const timer = setTimeout(() => {
        setFlash(null);
        onClearFeedback();
        inputRef.current?.focus();
      }, 1000);
      return () => clearTimeout(timer);
    }

    setFlash('error');
    const timer = setTimeout(() => {
      setFlash(null);
      onClearFeedback();
    }, 1000);
    return () => clearTimeout(timer);
  }, [submitResult, onClearFeedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || gaveUp) return;
    onSubmit(word.trim());
  };

  return (
    <>
      <TimerBar remainingMs={remainingMs} durationMs={durationMs} />
      <div className={`screen ${styles.round}`}>
        <p className={styles.roundInfo}>
          {t('common.roundOf', { current: roundNumber, total: totalRounds })}
        </p>
        <PlateTile text={letters.join(' ')} animate />
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={t('round.wordPlaceholder')}
            disabled={gaveUp}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className={`${styles.input} ${flash === 'success' ? styles.flashSuccess : ''} ${flash === 'error' ? styles.flashError : ''}`}
          />
          <button type="submit" className="btn btn-primary" disabled={gaveUp || !word.trim()}>
            {t('round.submit')}
          </button>
        </form>

        <div className={styles.feedbackArea}>
          {submitResult?.valid &&
            flash === 'success' &&
            submitResult.score !== undefined &&
            submitResult.matchCount !== undefined && (
            <p className={styles.feedbackSuccess}>
              {t('round.scoreFeedback', {
                score: submitResult.score,
                matchCount: submitResult.matchCount,
                count: submitResult.matchCount,
              })}
            </p>
          )}
          {submitResult && !submitResult.valid && submitResult.reason && (
            <p className={styles.feedbackError}>{translateError(t, submitResult.reason)}</p>
          )}
        </div>

        <div className={styles.giveUpArea}>
          {!gaveUp ? (
            <button type="button" className="text-link" onClick={onGiveUp}>
              {t('round.imDone')}
            </button>
          ) : (
            <p className="waiting-text">{t('round.waitingForOthers')}</p>
          )}
        </div>
      </div>
    </>
  );
}
