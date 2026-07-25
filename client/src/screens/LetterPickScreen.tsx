import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUND_COUNTDOWN_MS } from '@plate-game/shared';
import { LetterBoxes } from '../components/LetterBoxes';
import { PlateTile } from '../components/PlateTile';
import styles from './LetterPickScreen.module.css';

interface LetterPickScreenProps {
  isHost: boolean;
  roundNumber: number;
  totalRounds: number;
  onSetLetters: (mode: 'random' | 'manual', letters?: string) => void;
}

export function LetterPickScreen({
  isHost,
  roundNumber,
  totalRounds,
  onSetLetters,
}: LetterPickScreenProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'random' | 'manual'>('random');
  const [letters, setLetters] = useState('');

  const handleConfirm = () => {
    if (mode === 'random') {
      onSetLetters('random');
    } else if (letters.length === 4) {
      onSetLetters('manual', letters.toUpperCase());
    }
  };

  return (
    <div className="screen">
      <p className={styles.roundInfo}>
        {t('common.roundOf', { current: roundNumber, total: totalRounds })}
      </p>
      <h2>{isHost ? t('letterPick.chooseLetters') : t('letterPick.hostChoosing')}</h2>

      {isHost ? (
        <div className="card">
          <div className={styles.modeToggle}>
            <button
              className={`btn ${mode === 'random' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('random')}
            >
              {t('letterPick.random')}
            </button>
            <button
              className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('manual')}
            >
              {t('letterPick.manual')}
            </button>
          </div>

          {mode === 'manual' && (
            <div className={styles.manualInput}>
              <label htmlFor="letter-0">{t('letterPick.enterFourLetters')}</label>
              <LetterBoxes
                inputId="letter-0"
                value={letters}
                editable
                onChange={setLetters}
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={mode === 'manual' && letters.length !== 4}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {t('letterPick.confirmLetters')}
          </button>
        </div>
      ) : (
        <div className={styles.waiting}>
          <div className={styles.pulse} />
          <p className="waiting-text">{t('common.waitingForHost')}</p>
        </div>
      )}
    </div>
  );
}

export function CountdownScreen({
  letters,
  endsAt,
}: {
  letters: string[];
  endsAt: number | null;
}) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(Math.ceil(ROUND_COUNTDOWN_MS / 1000));

  useEffect(() => {
    if (!endsAt) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSeconds(remaining);
    };
    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div className={`screen ${styles.countdown}`}>
      <PlateTile text={letters.join(' ')} animate />
      <p className={styles.countdownNumber}>{seconds > 0 ? seconds : t('countdown.go')}</p>
    </div>
  );
}
