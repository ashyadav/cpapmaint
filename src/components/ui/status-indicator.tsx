import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"

export type StatusType = "overdue" | "due" | "ok"

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType
  label?: string
  showDot?: boolean
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, label, showDot = false, ...props }, ref) => {
    const statusConfig = {
      overdue: {
        color: "bg-status-overdue",
        text: "Overdue",
        dotColor: "bg-status-overdue",
      },
      due: {
        color: "bg-status-due",
        text: "Due Today",
        dotColor: "bg-status-due",
      },
      ok: {
        color: "bg-status-ok",
        text: "All Good",
        dotColor: "bg-status-ok",
      },
    }

    const config = statusConfig[status]
    const displayLabel = label || config.text

    if (showDot) {
      return (
        <div
          ref={ref}
          className={cn("flex items-center gap-2", className)}
          {...props}
        >
          <span className={cn("h-2 w-2 rounded-full", config.dotColor)} />
          <span className="text-sm font-medium">{displayLabel}</span>
        </div>
      )
    }

    return (
      <Badge
        ref={ref}
        variant={status}
        className={className}
        {...props}
      >
        {displayLabel}
      </Badge>
    )
  }
)
StatusIndicator.displayName = "StatusIndicator"

export { StatusIndicator }
