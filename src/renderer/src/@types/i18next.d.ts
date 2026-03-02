/**
 * Augments i18next's default type with our pt-BR translation schema so that
 * `t('key')` calls are fully type-checked and auto-completed.
 *
 * The single source of truth is `src/renderer/src/locales/pt-BR/translation.json`.
 */
import type translation from '../locales/pt-BR/translation.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof translation
    }
  }
}
