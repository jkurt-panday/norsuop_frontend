import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:border-destructive/50 dark:bg-destructive/20 dark:text-destructive-foreground",
        outline: "border-border text-foreground hover:bg-muted/50",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
        info:
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
      },
      size: {
        default: "h-5 text-xs",
        sm: "h-4 text-[11px] px-2",
        lg: "h-6 text-sm px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export type RequestStatus =
  | "processed"
  | "paid"
  | "cancelled"
  | "pending"
  | "unprocessed"
  | (string & {})

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: RequestStatus | null
  label?: string
  showDot?: boolean
}

function StatusBadge({
  status = "unprocessed",
  label,
  showDot = true,
  className,
  ...props
}: StatusBadgeProps) {
  const normalizedStatus = (status ?? "unprocessed").toLowerCase().trim()

  let badgeVariant: "success" | "info" | "destructive" | "warning" = "warning"
  let dotColor = "bg-amber-500"
  let displayLabel = label

  switch (normalizedStatus) {
    case "paid":
      badgeVariant = "success"
      dotColor = "bg-emerald-500"
      displayLabel = label ?? "Paid"
      break
    case "processed":
      badgeVariant = "info"
      dotColor = "bg-sky-500"
      displayLabel = label ?? "Processed"
      break
    case "cancelled":
      badgeVariant = "destructive"
      dotColor = "bg-rose-500"
      displayLabel = label ?? "Cancelled"
      break
    case "pending":
      badgeVariant = "warning"
      dotColor = "bg-amber-500"
      displayLabel = label ?? "Pending"
      break
    case "unprocessed":
    default:
      badgeVariant = "warning"
      dotColor = "bg-amber-500"
      displayLabel = label ?? "Unprocessed"
      break
  }

  return (
    <Badge
      variant={badgeVariant}
      className={cn("capitalize tracking-normal", className)}
      {...props}
    >
      {showDot && (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", dotColor)}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </Badge>
  )
}

export { Badge, StatusBadge, badgeVariants }
