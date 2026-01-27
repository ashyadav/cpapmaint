import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect, useCallback } from 'react'
import { Home } from '@/pages/Home'
import { Components } from '@/pages/Components'
import { ComponentDetail } from '@/pages/ComponentDetail'
import { ComponentForm } from '@/pages/ComponentForm'
import { MaintenanceActionForm } from '@/pages/MaintenanceActionForm'
import { Settings } from '@/pages/Settings'
import { UpdateNotification } from '@/components/UpdateNotification'
import { areNotificationsAllowed } from '@/lib/notifications'
import { startNotificationScheduler, updateBadgeCount } from '@/lib/notification-scheduler'

// Inner component that has access to router context
function AppContent() {
  const navigate = useNavigate()

  // Handle notification click - navigate to home to see due items
  const handleNotificationClick = useCallback(() => {
    navigate('/')
  }, [navigate])

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

  // Initialize notification scheduler if permissions are granted
  useEffect(() => {
    if (areNotificationsAllowed()) {
      // Start the notification scheduler with click handler
      startNotificationScheduler({
        onNotificationClick: handleNotificationClick,
        checkIntervalMinutes: 15,
      })

      // Update badge count on app load
      updateBadgeCount()
    }
  }, [handleNotificationClick])

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/components" element={<Components />} />
        <Route path="/components/new" element={<ComponentForm />} />
        <Route path="/components/:id" element={<ComponentDetail />} />
        <Route path="/components/:id/edit" element={<ComponentForm />} />
        <Route path="/components/:id/actions/new" element={<MaintenanceActionForm />} />
        <Route path="/components/:id/actions/:actionId/edit" element={<MaintenanceActionForm />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <UpdateNotification />
    </>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
