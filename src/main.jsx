import { StrictMode, Suspense, lazy, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ToastProvider from './components/ui/ToastProvider'

// dev-only component gallery, split out so it never ships in the production bundle
const DesignSystemGallery = import.meta.env.DEV
  ? lazy(() => import('./DesignSystemGallery.jsx'))
  : null

// entry file: nothing imports Root, so fast refresh doesn't apply
// eslint-disable-next-line react-refresh/only-export-components
function Root() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (import.meta.env.DEV && hash === '#design-system') {
    return (
      <Suspense fallback={null}>
        <DesignSystemGallery />
      </Suspense>
    )
  }

  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <Root />
    </ToastProvider>
  </StrictMode>,
)
