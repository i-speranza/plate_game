import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SCORE_CONFIG, type Language } from '@plate-game/shared';
import { setUiLanguage } from '../i18n';
import { LanguageSelect } from '../components/LanguageSelect';
import { translateError } from '../translateError';
import styles from './HomeScreen.module.css';

interface HomeScreenProps {
  onCreate: (nickname: string) => void;
  onJoin: (passcode: string, nickname: string) => void;
  error: string | null;
  connected: boolean;
}

const TITLE_ROWS = ['PLATE', 'WORD', 'GAME'];

const STEP_KEYS = ['1', '2', '3', '4'] as const;
const RULE_KEYS = ['1', '2', '3'] as const;

const topMaxScore = SCORE_CONFIG.bands[0].maxScore;
const SCORE_TIERS = SCORE_CONFIG.bands.map((band) => ({
  key: band.tier,
  max: band.maxScore,
  width: band.maxScore === 0 ? 8 : Math.round((band.maxScore / topMaxScore) * 100),
  zero: band.maxScore === 0,
}));

function TitlePlate({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div className={styles.titlePlate} aria-label={ariaLabel}>
      {TITLE_ROWS.map((word) => (
        <div key={word} className={styles.titleRow}>
          {word.split('').map((char, i) => (
            <span key={`${word}-${i}`} className={styles.titleBox}>
              {char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function HomeScreen({ onCreate, onJoin, error, connected }: HomeScreenProps) {
  const { t, i18n } = useTranslation();
  const [nickname, setNickname] = useState('');
  const [passcode, setPasscode] = useState('');
  const [mode, setMode] = useState<'menu' | 'join'>('menu');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setPasscode(code.toUpperCase());
      setMode('join');
    }
    const stored = sessionStorage.getItem('plateGameNickname');
    if (stored) setNickname(stored);
  }, []);

  const handleLanguageChange = (language: Language) => {
    setUiLanguage(language);
  };

  const handleCreate = () => {
    if (!nickname.trim()) return;
    onCreate(nickname.trim());
  };

  const handleJoin = () => {
    if (!nickname.trim() || !passcode.trim()) return;
    onJoin(passcode.trim().toUpperCase(), nickname.trim());
  };

  return (
    <div className={`screen ${styles.home}`}>
      <section className={styles.accessPanel} aria-label={t('home.accessPanelAria')}>
        <header className={styles.header}>
          <TitlePlate ariaLabel={t('home.titlePlateAria')} />
        </header>

        <div className={styles.languageRow}>
          <label htmlFor="ui-language">{t('language.label')}</label>
          <LanguageSelect
            id="ui-language"
            value={i18n.language as Language}
            onChange={handleLanguageChange}
            className={styles.languageSelect}
          />
        </div>

        {!connected && <p className={styles.connecting}>{t('home.connecting')}</p>}
        {error && <div className="error-banner">{translateError(t, error)}</div>}

        <div className="card">
          <label htmlFor="nickname">{t('home.nickname')}</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('home.nicknamePlaceholder')}
            maxLength={24}
            autoComplete="nickname"
          />
        </div>

        {mode === 'menu' ? (
          <div className={styles.actions}>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!nickname.trim() || !connected}>
              {t('home.createGame')}
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')} disabled={!connected}>
              {t('home.joinGame')}
            </button>
          </div>
        ) : (
          <div className={styles.joinForm}>
            <div className="card">
              <label htmlFor="passcode">{t('common.passcode')}</label>
              <input
                id="passcode"
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                placeholder={t('home.passcodePlaceholder')}
                maxLength={6}
                autoComplete="off"
                style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleJoin}
              disabled={!nickname.trim() || passcode.length < 6 || !connected}
            >
              {t('home.join')}
            </button>
            <button className="text-link" onClick={() => setMode('menu')}>
              {t('home.back')}
            </button>
          </div>
        )}
      </section>

      <section className={styles.instructions} aria-labelledby="how-to-play">
        <h2 id="how-to-play">{t('home.howToPlay')}</h2>
        <p className={styles.instructionsIntro}>{t('home.intro')}</p>

        <ol className={styles.steps}>
          {STEP_KEYS.map((key, i) => (
            <li key={key} className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">
                {i + 1}
              </span>
              <span>{t(`home.steps.${key}`)}</span>
            </li>
          ))}
        </ol>

        <div className={styles.panels}>
          <div className={styles.panel}>
            <h3>{t('home.wordRules')}</h3>
            <ul>
              {RULE_KEYS.map((key) => (
                <li key={key}>{t(`home.rules.${key}`)}</li>
              ))}
            </ul>
          </div>

          <div className={styles.panel}>
            <h3>{t('home.scoring')}</h3>
            <p className={styles.scoringNote}>
              <Trans i18nKey="home.scoringNote" components={{ 1: <strong />, 2: <strong /> }} />
            </p>
            <ul className={styles.scoreTiers}>
              {SCORE_TIERS.map((tier) => (
                <li key={tier.key} className={tier.zero ? styles.scoreTierZero : undefined}>
                  <div className={styles.scoreTierHeader}>
                    <span>{t(`home.scoreTiers.${tier.key}`)}</span>
                    <span className={styles.scoreTierPts}>
                      {tier.max > 0 ? t('home.upTo', { count: tier.max }) : t('home.zeroPts')}
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
            <p className={styles.scoringFooter}>{t('home.scoringFooter')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
