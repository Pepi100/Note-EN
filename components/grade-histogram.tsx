"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface GradeHistogramProps {
  data: number[]
  title: string
  precomputed?: boolean
}

// Custom tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="font-medium">{`Interval de note: ${label}`}</p>
        <p className="text-sm">
          <span className="font-medium">{Number(payload[0].value).toLocaleString("ro-RO")}</span> studenți
        </p>
      </div>
    )
  }
  return null
}

export function GradeHistogram({ data, title, precomputed = false }: GradeHistogramProps) {
  if (!data || data.length === 0 || (precomputed && data.every((count) => count === 0))) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Nu sunt date disponibile pentru {title.toLowerCase()}
      </div>
    )
  }

  // Define grade intervals (bins)
  const bins: any[] | undefined = []
  for (let i = 1; i <= 9; i++) {
    // X.00 to X.49
    bins.push({
      range: `${i}–${i},49`,
      count: 0,
      lower: i,
      upper: i + 0.49,
    })

    // X.50 to X.99
    bins.push({
      range: `${i},5–${i},99`,
      count: 0,
      lower: i + 0.5,
      upper: i + 0.99,
    })
  }

  // Add the special "Exact 10" bin
  bins.push({
    range: "10",
    count: 0,
    lower: 10.0,
    upper: 10.0, // For exact match
  })

  if (precomputed) {
    data.forEach((count, index) => {
      if (bins[index]) bins[index].count = count
    })
  } else {
    data.forEach((grade) => {
      const roundedGrade = Number.parseFloat(grade.toFixed(2))

      if (roundedGrade === 10.0) {
        const exact10Bin = bins.find((b) => b.lower === 10 && b.upper === 10)
        if (exact10Bin) exact10Bin.count++
      } else if (roundedGrade >= 1 && roundedGrade < 10) {
        for (let i = 0; i < bins.length; i++) {
          if (bins[i].lower === 10 && bins[i].upper === 10) continue
          if (roundedGrade >= bins[i].lower && roundedGrade <= bins[i].upper + 0.000001) {
            bins[i].count++
            break
          }
        }
      }
    })
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 20, right: 16, left: 8, bottom: 56 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value: number) => value.toLocaleString("ro-RO")}
            label={{ value: "Elevi", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
