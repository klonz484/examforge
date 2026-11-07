import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './components/ui/styles.css'
import './styles.css'

document.documentElement.dataset.uiTheme = 'dark'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((error) => console.error('Service worker registration failed:', error))
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
