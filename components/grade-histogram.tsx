"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface GradeHistogramProps {
  data: number[]
  title: string
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

  // Create histogram bins
  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: `${i + 1}`,
    count: 0,
    grade: i + 1,
  }))

  // Count grades in each bin
  data.forEach((grade) => {
    if (grade >= 1 && grade <= 10) {
      const binIndex = Math.floor(grade) - 1
      if (binIndex >= 0 && binIndex < 10) {
        bins[binIndex].count++
      }
    }
  })

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="grade"
            tick={{ fontSize: 12 }}
            label={{ value: "Grade", position: "insideBottom", offset: -5 }}
          />
          <YAxis tick={{ fontSize: 12 }} label={{ value: "Students", angle: -90, position: "insideLeft" }} />
          <Tooltip formatter={(value) => [value, "Students"]} labelFormatter={(label) => `Grade ${label}`} />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
