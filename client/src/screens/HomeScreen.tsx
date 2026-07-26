import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Language } from '@plate-game/shared';
import { setUiLanguage } from '../i18n';
import { LanguageSelect } from '../components/LanguageSelect';
import { translateError } from '../translateError';
import { HowToPlayScreen } from './HowToPlayScreen';
import styles from './HomeScreen.module.css';

interface HomeScreenProps {
  onCreate: (nickname: string) => void;
  onJoin: (passcode: string, nickname: string) => void;
  error: string | null;
  connected: boolean;
}

const TITLE_ROWS = ['PLATE', 'WORD', 'GAME'];

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
  const [view, setView] = useState<'home' | 'howToPlay'>('home');

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

  if (view === 'howToPlay') {
    return <HowToPlayScreen onBack={() => setView('home')} />;
  }

  return (
    <div className={`screen ${styles.home}`}>
      <section className={styles.accessPanel} aria-label={t('home.accessPanelAria')}>
        <header className={styles.header}>
          <TitlePlate ariaLabel={t('home.titlePlateAria')} />
          <p className={styles.tagline}>{t('home.tagline')}</p>
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

        <p className={styles.rulesLinkRow}>
          <button type="button" className="text-link" onClick={() => setView('howToPlay')}>
            {t('home.viewHowToPlay')}
          </button>
        </p>
      </section>
    </div>
  );
}
