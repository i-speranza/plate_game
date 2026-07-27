import type { TFunction } from 'i18next';

export function translateError(t: TFunction, code: string, params?: Record<string, unknown>): string {
  return t(`errors.${code}`, { defaultValue: code, ...params });
}
