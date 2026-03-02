import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './main.css'
// i18n must be initialised before any component renders.
import './lib/i18n'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found in index.html')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
