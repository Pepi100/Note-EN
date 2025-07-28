"use client"

interface CustomChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: any
    name: string
    color?: string
    dataKey: string
  }>
  label?: string
}

export function CustomChartTooltip({ active, payload, label }: CustomChartTooltipProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg border-border">
      <p className="font-semibold text-foreground mb-2 text-sm">Anul {label}</p>
      <div className="space-y-1.5">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-3 min-w-[200px]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-muted-foreground whitespace-nowrap">{item.name}</span>
            </div>
            <span className="font-semibold text-foreground text-sm">
              {typeof item.value === "number"
                ? item.dataKey.includes("average") || item.dataKey.includes("Grade")
                  ? item.value.toFixed(2)
                  : item.value.toLocaleString("ro-RO")
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
