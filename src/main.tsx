import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
// Звук (lib/sound) сам розблоковується першим дотиком — політика автоплею браузера/iOS.
import './lib/sound'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
