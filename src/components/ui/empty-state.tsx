import * as React from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title = "All caught up!", description, icon, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center",
          className
        )}
        {...props}
      >
        {icon && (
          <div className="mb-4 text-muted-foreground">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-muted-foreground max-w-md mb-6">
            {description}
          </p>
        )}
        {children}
        {action && (
          <div className="mt-6">
            {action}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
