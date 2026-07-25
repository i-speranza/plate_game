import type { TFunction } from 'i18next';

export function translateError(t: TFunction, code: string): string {
  return t(`errors.${code}`, { defaultValue: code });
}
