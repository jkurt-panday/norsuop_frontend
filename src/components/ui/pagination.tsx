import * as React from "react"
import { cn } from "cn"
import { Button } from "./button"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-wrap items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  disabled?: boolean
  size?: "default" | "sm" | "lg" | "icon"
  href?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

function PaginationLink({
  className,
  isActive,
  disabled,
  size = "icon",
  href,
  children,
  ...props
}: PaginationLinkProps) {
  if (href) {
    return (
      <Button
        variant={isActive ? "outline" : "ghost"}
        size={size}
        className={cn(isActive && "font-semibold pointer-events-none", className)}
        render={<a href={href} aria-current={isActive ? "page" : undefined} />}
      >
        {children}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant={isActive ? "outline" : "ghost"}
      size={size}
      disabled={disabled}
      aria-current={isActive ? "page" : undefined}
      className={cn(isActive && "font-semibold pointer-events-none border-primary/40 bg-accent", className)}
      {...props}
    >
      {children}
    </Button>
  )
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: PaginationLinkProps & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
      <span className="hidden sm:inline">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: PaginationLinkProps & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:inline">{text}</span>
      <ChevronRightIcon className="size-4" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center text-muted-foreground",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
