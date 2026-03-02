import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import ptBR from '../locales/pt-BR/translation.json'

/**
 * i18next configuration for KiosKids renderer.
 *
 * Resources are bundled inline (no HTTP backend) — required for offline-first Electron.
 * MVP targets pt-BR only; additional locales can be added in Phase 3 (see roadmap).
 */
i18next.use(initReactI18next).init({
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  defaultNS: 'translation',
  resources: {
    'pt-BR': {
      translation: ptBR,
    },
  },
  interpolation: {
    // React already escapes output — no need for i18next to double-escape.
    escapeValue: false,
  },
})

export default i18next
