"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Chart Container
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: Record<string, any>
  }
>(({ className, config, ...props }, ref) => {
  return <div ref={ref} className={cn("w-full", className)} {...props} />
})
ChartContainer.displayName = "ChartContainer"

// Chart Tooltip
const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    content?: React.ComponentType<any>
  }
>(({ className, content: Content, ...props }, ref) => {
  return <div ref={ref} className={cn("rounded-lg border bg-background p-2 shadow-md", className)} {...props} />
})
ChartTooltip.displayName = "ChartTooltip"

// Chart Tooltip Content
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean
    payload?: Array<{
      value: any
      name: string
      color?: string
    }>
    label?: string
    hideLabel?: boolean
    indicator?: "dot" | "line" | "dashed"
  }
>(({ className, active, payload, label, hideLabel = false, indicator = "dot", ...props }, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
      {...props}
    >
      {!hideLabel && label && <p className="font-medium text-foreground">{label}</p>}
      <div className="grid gap-1.5">
        {payload.map((item, index) => (
          <div
            key={index}
            className="flex w-full items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground"
          >
            <div
              className={cn("shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]", {
                "h-2.5 w-2.5": indicator === "dot",
                "w-1": indicator === "line",
                "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
              })}
              style={
                {
                  "--color-bg": item.color,
                  "--color-border": item.color,
                } as React.CSSProperties
              }
            />
            <div className="flex flex-1 justify-between leading-none">
              <div className="grid gap-1.5">
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-mono font-medium tabular-nums text-foreground">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }
