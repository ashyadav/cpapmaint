import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Home } from '@/pages/Home'
import { Components } from '@/pages/Components'
import { ComponentDetail } from '@/pages/ComponentDetail'
import { ComponentForm } from '@/pages/ComponentForm'
import { MaintenanceActionForm } from '@/pages/MaintenanceActionForm'

function App() {
  // Dark mode detection and setup
  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }

    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/components" element={<Components />} />
        <Route path="/components/new" element={<ComponentForm />} />
        <Route path="/components/:id" element={<ComponentDetail />} />
        <Route path="/components/:id/edit" element={<ComponentForm />} />
        <Route path="/components/:id/actions/new" element={<MaintenanceActionForm />} />
        <Route path="/components/:id/actions/:actionId/edit" element={<MaintenanceActionForm />} />
      </Routes>
    </Router>
  )
}

export default App
