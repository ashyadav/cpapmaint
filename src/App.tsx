import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">
            CPAP Maintenance Tracker
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your CPAP equipment maintenance and cleaning schedules
          </p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-card-foreground">
              Welcome to CPAP Maintenance Tracker
            </h2>
            <p className="text-muted-foreground">
              Phase 1.1: Foundation & Infrastructure Complete
            </p>
            <div className="mt-6 space-y-2 text-left text-sm">
              <p className="text-muted-foreground">✅ React + TypeScript + Vite</p>
              <p className="text-muted-foreground">✅ Tailwind CSS configured</p>
              <p className="text-muted-foreground">✅ React Router setup</p>
              <p className="text-muted-foreground">✅ PWA plugin configured</p>
              <p className="text-muted-foreground">✅ Dark mode support</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

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
      </Routes>
    </Router>
  )
}

export default App
