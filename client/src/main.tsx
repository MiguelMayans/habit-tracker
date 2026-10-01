import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Installs the service worker (see vite.config.ts for what it caches). In
// `pnpm dev` this does nothing: the service worker only exists in the
// production build, so it never caches code you are still changing.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
