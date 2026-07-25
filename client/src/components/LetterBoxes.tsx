import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LetterBoxes.module.css';

const LETTER_COUNT = 4;

interface LetterBoxesProps {
  value: string;
  editable?: boolean;
  animate?: boolean;
  onChange?: (value: string) => void;
  inputId?: string;
}

function normalizeLetters(raw: string): string {
  return raw.replace(/[^a-zA-Z]/g, '').slice(0, LETTER_COUNT).toUpperCase();
}

export function LetterBoxes({
  value,
  editable = false,
  animate = false,
  onChange,
  inputId,
}: LetterBoxesProps) {
  const { t } = useTranslation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length: LETTER_COUNT }, (_, i) => value[i] ?? '');

  const focusAt = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const applyValue = (next: string, focusIndex?: number) => {
    const normalized = normalizeLetters(next);
    onChange?.(normalized);
    if (focusIndex !== undefined) {
      const target = Math.min(Math.max(focusIndex, 0), LETTER_COUNT - 1);
      requestAnimationFrame(() => focusAt(target));
    }
  };

  const handleChange = (index: number, nextChar: string) => {
    const letter = normalizeLetters(nextChar).slice(-1);
    const next = chars.slice();
    next[index] = letter;
    applyValue(next.join(''), letter ? index + 1 : index);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[index] && index > 0) {
      e.preventDefault();
      const next = chars.slice();
      next[index - 1] = '';
      applyValue(next.join(''), index - 1);
      return;
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (e.key === 'ArrowRight' && index < LETTER_COUNT - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = normalizeLetters(e.clipboardData.getData('text'));
    if (!pasted) return;
    applyValue(pasted, Math.min(pasted.length, LETTER_COUNT - 1));
  };

  return (
    <div
      className={`${styles.row} ${animate ? styles.animate : ''}`}
      role={editable ? undefined : 'group'}
      aria-label={editable ? undefined : t('aria.plateLetters', { value })}
    >
      {chars.map((char, index) =>
        editable ? (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            id={index === 0 ? inputId : undefined}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={1}
            value={char}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={styles.box}
            aria-label={t('aria.letterN', { n: index + 1 })}
          />
        ) : (
          <div key={index} className={styles.box} aria-hidden={!char}>
            {char}
          </div>
        ),
      )}
    </div>
  );
}
