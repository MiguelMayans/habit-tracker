import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startServiceWorker } from './lib/pwa'
import { armSound } from './lib/sound'

// The service worker, and how new versions arrive: see lib/pwa.ts.
startServiceWorker()

// Browsers only allow audio after a first touch: see lib/sound.ts.
armSound()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
