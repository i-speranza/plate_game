import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MatchSettings, SessionSnapshot } from '@plate-game/shared';
import { DURATION_PRESETS } from '@plate-game/shared';
import { setUiLanguage } from '../i18n';
import { LanguageSelect } from '../components/LanguageSelect';
import { PlateTile } from '../components/PlateTile';
import { PlayerList } from '../components/PlayerList';
import styles from './LobbyScreen.module.css';

interface LobbyScreenProps {
  snapshot: SessionSnapshot;
  isHost: boolean;
  onUpdateSettings: (settings: Partial<MatchSettings>) => void;
  onStart: () => void;
}

export function LobbyScreen({ snapshot, isHost, onUpdateSettings, onStart }: LobbyScreenProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/?code=${snapshot.passcode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleLanguageChange = (language: MatchSettings['language']) => {
    setUiLanguage(language);
    onUpdateSettings({ language });
  };

  return (
    <div className="screen">
      <h2>{t('lobby.title')}</h2>

      <div className={styles.passcodeSection}>
        <p className={styles.label}>{t('common.passcode')}</p>
        <PlateTile text={snapshot.passcode} variant="passcode" />
        <button className="btn btn-secondary" onClick={copyLink}>
          {copied ? t('lobby.copied') : t('lobby.copyShareLink')}
        </button>
      </div>

      <div>
        <h3>{t('lobby.players')}</h3>
        <PlayerList players={snapshot.players} hostId={snapshot.hostId} />
      </div>

      {isHost && (
        <div className="card">
          <h3>{t('lobby.matchSettings')}</h3>
          <div className={styles.settings}>
            <div>
              <label htmlFor="rounds">{t('lobby.rounds')}</label>
              <input
                id="rounds"
                type="number"
                min={1}
                max={20}
                value={snapshot.settings.rounds}
                onChange={(e) => onUpdateSettings({ rounds: Number(e.target.value) })}
              />
            </div>
            <div>
              <label htmlFor="duration">{t('lobby.roundDuration')}</label>
              <select
                id="duration"
                value={snapshot.settings.durationSec}
                onChange={(e) => onUpdateSettings({ durationSec: Number(e.target.value) })}
              >
                {DURATION_PRESETS.map((d) => (
                  <option key={d} value={d}>
                    {t('lobby.durationSeconds', { count: d })}
                  </option>
                ))}
                {!DURATION_PRESETS.includes(snapshot.settings.durationSec as (typeof DURATION_PRESETS)[number]) && (
                  <option value={snapshot.settings.durationSec}>
                    {t('lobby.durationSeconds', { count: snapshot.settings.durationSec })}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label htmlFor="language">{t('language.label')}</label>
              <LanguageSelect
                id="language"
                value={snapshot.settings.language}
                onChange={handleLanguageChange}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={onStart} style={{ marginTop: '1rem', width: '100%' }}>
            {t('lobby.startGame')}
          </button>
        </div>
      )}

      {!isHost && <p className="waiting-text">{t('common.waitingForHost')}</p>}
    </div>
  );
}
