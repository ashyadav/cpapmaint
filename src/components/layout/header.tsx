import * as React from "react"
import { cn } from "@/lib/utils"

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  description?: string
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn("border-b bg-background", className)}
        {...props}
      >
        <div className="container mx-auto px-4 py-6">
          {title && (
            <h1 className="text-3xl font-bold text-foreground">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-muted-foreground mt-2">
              {description}
            </p>
          )}
          {children}
        </div>
      </header>
    )
  }
)
Header.displayName = "Header"

export { Header }
