import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Header, Container } from '@/components/layout'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Textarea,
  Select,
  Label,
  StatusIndicator,
  EmptyState,
  Skeleton,
  Spinner
} from '@/components/ui'

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="CPAP Maintenance Tracker"
        description="Track your CPAP equipment maintenance and cleaning schedules"
      />

      <main>
        <Container size="lg">
          {/* Phase Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Phase 1.2: Design System & Core Components</CardTitle>
              <CardDescription>Complete design system and component library</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">✅ Color palette with status colors (Red/Yellow/Green)</p>
                <p className="text-muted-foreground">✅ Tailwind theme configured</p>
                <p className="text-muted-foreground">✅ Base UI components (Button, Card, Badge)</p>
                <p className="text-muted-foreground">✅ Form components (Input, Select, Textarea, Label)</p>
                <p className="text-muted-foreground">✅ Layout components (Header, Container, Navigation)</p>
                <p className="text-muted-foreground">✅ Status indicators</p>
                <p className="text-muted-foreground">✅ Empty state component</p>
                <p className="text-muted-foreground">✅ Loading states and skeletons</p>
              </div>
            </CardContent>
          </Card>

          {/* Component Showcase */}
          <div className="space-y-8">
            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>Various button variants and sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </CardContent>
            </Card>

            {/* Status Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Status Indicators</CardTitle>
                <CardDescription>Red/Yellow/Green status colors for maintenance tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <StatusIndicator status="overdue" />
                  <StatusIndicator status="due" />
                  <StatusIndicator status="ok" />
                </div>
                <div className="flex flex-wrap gap-4">
                  <StatusIndicator status="overdue" showDot />
                  <StatusIndicator status="due" showDot />
                  <StatusIndicator status="ok" showDot />
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Badge variants for labels and tags</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="overdue">Overdue</Badge>
                  <Badge variant="due">Due Today</Badge>
                  <Badge variant="ok">All Good</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Form Components */}
            <Card>
              <CardHeader>
                <CardTitle>Form Components</CardTitle>
                <CardDescription>Input fields, selects, and textareas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="input-demo">Input Field</Label>
                  <Input id="input-demo" placeholder="Enter text..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="select-demo">Select Dropdown</Label>
                  <Select id="select-demo">
                    <option value="">Select an option</option>
                    <option value="1">Option 1</option>
                    <option value="2">Option 2</option>
                    <option value="3">Option 3</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textarea-demo">Textarea</Label>
                  <Textarea id="textarea-demo" placeholder="Enter notes..." />
                </div>
              </CardContent>
            </Card>

            {/* Loading States */}
            <Card>
              <CardHeader>
                <CardTitle>Loading States</CardTitle>
                <CardDescription>Spinners and skeleton loaders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-4">Spinners</p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Spinner size="sm" />
                    <Spinner size="md" />
                    <Spinner size="lg" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-4">Skeletons</p>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Empty State */}
            <Card>
              <CardHeader>
                <CardTitle>Empty State</CardTitle>
                <CardDescription>State when no items are due</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  title="All caught up!"
                  description="Great work! Everything is up to date. Next maintenance: Water chamber clean in 2 days."
                  action={<Button>View Schedule</Button>}
                />
              </CardContent>
            </Card>
          </div>
        </Container>
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
