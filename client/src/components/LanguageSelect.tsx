import { useTranslation } from 'react-i18next';
import type { Language } from '@plate-game/shared';
import styles from './LanguageSelect.module.css';

const OPTIONS: { value: Language; flag: string; labelKey: 'language.it' | 'language.en' }[] = [
  { value: 'it', flag: '🇮🇹', labelKey: 'language.it' },
  { value: 'en', flag: '🇬🇧', labelKey: 'language.en' },
];

interface LanguageSelectProps {
  id: string;
  value: Language;
  onChange: (language: Language) => void;
  className?: string;
}

export function LanguageSelect({ id, value, onChange, className }: LanguageSelectProps) {
  const { t } = useTranslation();

  return (
    <select
      id={id}
      className={className ?? styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value as Language)}
    >
      {OPTIONS.map(({ value: lang, flag, labelKey }) => (
        <option key={lang} value={lang}>
          {flag} {t(labelKey)}
        </option>
      ))}
    </select>
  );
}
