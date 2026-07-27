import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LetterBoxes.module.css';

interface LetterBoxesProps {
  value: string;
  count?: number;
  editable?: boolean;
  animate?: boolean;
  highlightedIndices?: boolean[];
  onChange?: (value: string) => void;
  inputId?: string;
}

function normalizeLetters(raw: string, letterCount: number): string {
  return raw.replace(/[^a-zA-Z]/g, '').slice(0, letterCount).toUpperCase();
}

export function LetterBoxes({
  value,
  count,
  editable = false,
  animate = false,
  highlightedIndices,
  onChange,
  inputId,
}: LetterBoxesProps) {
  const { t } = useTranslation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const letterCount = count ?? Math.max(value.length, 1);
  const chars = Array.from({ length: letterCount }, (_, i) => value[i] ?? '');

  const focusAt = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const applyValue = (next: string, focusIndex?: number) => {
    const normalized = normalizeLetters(next, letterCount);
    onChange?.(normalized);
    if (focusIndex !== undefined) {
      const target = Math.min(Math.max(focusIndex, 0), letterCount - 1);
      requestAnimationFrame(() => focusAt(target));
    }
  };

  const handleChange = (index: number, nextChar: string) => {
    const letter = normalizeLetters(nextChar, letterCount).slice(-1);
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

    if (e.key === 'ArrowRight' && index < letterCount - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = normalizeLetters(e.clipboardData.getData('text'), letterCount);
    if (!pasted) return;
    applyValue(pasted, Math.min(pasted.length, letterCount - 1));
  };

  return (
    <div
      className={`${styles.row} ${animate ? styles.animate : ''} ${letterCount >= 6 ? styles.compact : ''}`}
      role={editable ? undefined : 'group'}
      aria-label={editable ? undefined : t('aria.plateLetters', { value })}
    >
      {chars.map((char, index) => {
        const highlighted = highlightedIndices?.[index] ?? false;
        const boxClass = `${styles.box}${highlighted ? ` ${styles.highlighted}` : ''}`;

        return editable ? (
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
            className={boxClass}
            aria-label={t('aria.letterN', { n: index + 1 })}
          />
        ) : (
          <div key={index} className={boxClass} aria-hidden={!char}>
            {char}
          </div>
        );
      })}
    </div>
  );
}
