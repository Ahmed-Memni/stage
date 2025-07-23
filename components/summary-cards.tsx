"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface SummaryCardsProps {
  data: any[]
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const stats = useMemo(() => {
    if (data.length === 0) {
      return {
        totalLogs: 0,
        uniqueSensors: 0,
        minValue: 0,
        maxValue: 0,
        latestTimestamp: "N/A",
      }
    }

    const values = data.map((item) => item.value).filter((v) => typeof v === "number")
    const timestamps = data.map((item) => new Date(item.timestamp)).sort((a, b) => b.getTime() - a.getTime())

    return {
      totalLogs: data.length,
      uniqueSensors: new Set(data.map((item) => item.sensor_id)).size,
      minValue: values.length > 0 ? Math.min(...values) : 0,
      maxValue: values.length > 0 ? Math.max(...values) : 0,
      latestTimestamp: timestamps.length > 0 ? timestamps[0].toLocaleString() : "N/A",
    }
  }, [data])

  const cards = [
    { title: "Total Logs", value: stats.totalLogs.toLocaleString(), icon: "📊" },
    { title: "Unique Sensors", value: stats.uniqueSensors, icon: "🔧" },
    { title: "Min Value", value: stats.minValue.toFixed(2), icon: "📉" },
    { title: "Max Value", value: stats.maxValue.toFixed(2), icon: "📈" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">{card.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
