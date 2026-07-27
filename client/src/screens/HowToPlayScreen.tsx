import { Trans, useTranslation } from 'react-i18next';
import { DEFAULT_LETTER_COUNT, getDisplayScoreBands } from '@plate-game/shared';
import styles from './HowToPlayScreen.module.css';

interface HowToPlayScreenProps {
  onBack: () => void;
}

const SECTION_KEYS = [
  'gettingStarted',
  'lobby',
  'letterPick',
  'duringRound',
  'roundSummary',
  'finalResults',
] as const;

const RULE_KEYS = ['1', '2', '3'] as const;

const displayBands = getDisplayScoreBands(DEFAULT_LETTER_COUNT);
const topMaxScore = displayBands[0]?.maxScore ?? 1;
const SCORE_TIERS = displayBands.map((band) => ({
  key: band.tier,
  max: band.maxScore,
  width: band.maxScore === 0 ? 8 : Math.round((band.maxScore / topMaxScore) * 100),
  zero: band.maxScore === 0,
}));

function SectionList({ sectionKey }: { sectionKey: (typeof SECTION_KEYS)[number] }) {
  const { t } = useTranslation();
  const items = t(`howToPlay.${sectionKey}.items`, { returnObjects: true }) as Record<string, string>;

  return (
    <section className={styles.section} aria-labelledby={`section-${sectionKey}`}>
      <h2 id={`section-${sectionKey}`}>{t(`howToPlay.${sectionKey}.title`)}</h2>
      <ul className={styles.sectionList}>
        {Object.keys(items).map((key) => (
          <li key={key}>{items[key]}</li>
        ))}
      </ul>
    </section>
  );
}

export function HowToPlayScreen({ onBack }: HowToPlayScreenProps) {
  const { t } = useTranslation();

  return (
    <div className={`screen ${styles.howToPlay}`}>
      <p className={styles.backRow}>
        <button type="button" className="text-link" onClick={onBack}>
          {t('howToPlay.back')}
        </button>
      </p>

      <article className={styles.content}>
        <h1>{t('howToPlay.title')}</h1>
        <p className={styles.intro}>{t('howToPlay.intro')}</p>

        {SECTION_KEYS.map((key) => (
          <SectionList key={key} sectionKey={key} />
        ))}

        <div className={styles.panels}>
          <div className={styles.panel}>
            <h3>{t('howToPlay.wordRules.title')}</h3>
            <ul>
              {RULE_KEYS.map((key) => (
                <li key={key}>{t(`howToPlay.wordRules.${key}`)}</li>
              ))}
            </ul>
          </div>

          <div className={styles.panel}>
            <h3>{t('howToPlay.scoring.title')}</h3>
            <p className={styles.scoringNote}>
              <Trans i18nKey="howToPlay.scoring.note" components={{ 1: <strong />, 2: <strong /> }} />
            </p>
            <ul className={styles.scoreTiers}>
              {SCORE_TIERS.map((tier) => (
                <li key={tier.key} className={tier.zero ? styles.scoreTierZero : undefined}>
                  <div className={styles.scoreTierHeader}>
                    <span>{t(`howToPlay.scoring.tiers.${tier.key}`)}</span>
                    <span className={styles.scoreTierPts}>
                      {tier.max > 0 ? t('howToPlay.scoring.upTo', { count: tier.max }) : t('howToPlay.scoring.zeroPts')}
                    </span>
                  </div>
                  <div className={styles.scoreBarTrack}>
                    <div
                      className={styles.scoreBarFill}
                      style={{ width: `${tier.width}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className={styles.scoringFooter}>{t('howToPlay.scoring.footer')}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
