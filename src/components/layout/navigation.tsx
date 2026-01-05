import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
  items?: Array<{
    label: string
    href: string
    active?: boolean
  }>
}

const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, items = [], ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn("border-b bg-background", className)}
        {...props}
      >
        <div className="container mx-auto px-4">
          <ul className="flex space-x-6 py-4">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    item.active
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    )
  }
)
Navigation.displayName = "Navigation"

export { Navigation }
