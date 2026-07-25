import { useTranslation } from 'react-i18next';
import { LetterBoxes } from './LetterBoxes';
import styles from './PlateTile.module.css';

interface PlateTileProps {
  text: string;
  variant?: 'letters' | 'passcode';
  animate?: boolean;
}

export function PlateTile({ text, variant = 'letters', animate = false }: PlateTileProps) {
  const { t } = useTranslation();

  if (variant === 'letters') {
    const letters = text.split('').filter((c) => c.trim()).join('');
    return <LetterBoxes value={letters} animate={animate} />;
  }

  return (
    <div className={`${styles.plate} ${styles.passcode}`} aria-label={t('aria.passcode', { text })}>
      <div className={styles.inner}>
        {text.split('').map((char, i) => (
          <span key={`${char}-${i}`} className={styles.letter}>
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
