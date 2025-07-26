"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface GradeHistogramProps {
  data: number[]
  title: string
}

// Custom tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="font-medium">{`Grade Interval: ${label}`}</p>
        <p className="text-sm">
          <span className="font-medium">{payload[0].value}</span> students
        </p>
      </div>
    )
  }
  return null
}

export function GradeHistogram({ data, title }: GradeHistogramProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available for {title.toLowerCase()}
      </div>
    )
  }

  // Define grade intervals (bins)
  const bins = []
  for (let i = 1; i <= 9; i++) {
    // X.00 to X.49
    bins.push({
      range: `${i.toFixed(2)} to ${(i + 0.49).toFixed(2)}`,
      count: 0,
      lower: i,
      upper: i + 0.49,
    })

    // X.50 to X.99
    bins.push({
      range: `${(i + 0.5).toFixed(2)} to ${(i + 0.99).toFixed(2)}`,
      count: 0,
      lower: i + 0.5,
      upper: i + 0.99,
    })
  }

  // Add the special "Exact 10" bin
  bins.push({
    range: `Exact 10`,
    count: 0,
    lower: 10.0,
    upper: 10.0, // For exact match
  })

  // Count grades in each bin
  data.forEach((grade) => {
    // Round grade to 2 decimal places to handle floating point precision for binning
    const roundedGrade = Number.parseFloat(grade.toFixed(2))

    if (roundedGrade === 10.0) {
      // Assign to "Exact 10" bin
      const exact10Bin = bins.find((b) => b.range === "Exact 10")
      if (exact10Bin) {
        exact10Bin.count++
      }
    } else if (roundedGrade >= 1 && roundedGrade < 10) {
      // Assign to other intervals
      for (let i = 0; i < bins.length; i++) {
        // Skip the "Exact 10" bin in this loop
        if (bins[i].range === "Exact 10") continue

        // Check if roundedGrade falls within the current bin's range
        // Use a small epsilon for the upper bound to ensure inclusivity for the upper limit of the interval
        if (roundedGrade >= bins[i].lower && roundedGrade <= bins[i].upper + 0.000001) {
          bins[i].count++
          break // Grade assigned, move to next student
        }
      }
    }
  })

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="range" // Use the 'range' property for labels
            tick={{ fontSize: 10 }} // Adjust font size for longer labels
            angle={-45} // Rotate labels to prevent overlap
            textAnchor="end" // Anchor text at the end for rotation
            interval={0} // Show all labels
            label={{ value: "Grade Interval", position: "insideBottom", offset: 20 }} // Adjusted offset
          />
          <YAxis tick={{ fontSize: 12 }} label={{ value: "Students", angle: -90, position: "insideLeft" }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
