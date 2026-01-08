import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';

export function WelcomeStep() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/setup/select');
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Welcome to CPAP Maintenance Tracker
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Build consistent CPAP maintenance habits and never worry about equipment hygiene again
        </p>
      </div>

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>What you'll get</CardTitle>
          <CardDescription>
            A simple, powerful tool to track your CPAP equipment maintenance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Track cleaning schedules automatically
                </p>
                <p className="text-sm text-muted-foreground">
                  Get reminders for daily rinses, weekly deep cleans, and everything in between
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Never forget equipment replacements
                </p>
                <p className="text-sm text-muted-foreground">
                  Know exactly when to replace mask cushions, filters, and other components
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Build consistent maintenance habits
                </p>
                <p className="text-sm text-muted-foreground">
                  Track streaks and compliance to stay motivated and reduce decision fatigue
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Medical audit trail for compliance
                </p>
                <p className="text-sm text-muted-foreground">
                  Keep a complete timestamped log for insurance or medical records
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Setup Time Indicator */}
      <div className="rounded-lg bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Setup takes 2-3 minutes</span>
          {' · '}
          All data is stored locally on your device
        </p>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button size="lg" onClick={handleGetStarted} className="px-8">
          Get Started
          <svg
            className="ml-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
