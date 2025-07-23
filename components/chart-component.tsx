"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface ChartComponentProps {
  data: any[]
  chartType: string
  onChartTypeChange: (type: string) => void
}

export function ChartComponent({ data, chartType, onChartTypeChange }: ChartComponentProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return []

    if (chartType === "line") {
      // Group data by timestamp and create time series
      const timeGroups = data.reduce((acc, item) => {
        const time = new Date(item.timestamp).toLocaleTimeString()
        if (!acc[time]) {
          acc[time] = { time }
        }
        acc[time][item.sensor_id] = item.value
        return acc
      }, {})

      return Object.values(timeGroups).slice(-20) // Last 20 time points
    } else {
      // Bar chart - average values per sensor
      const sensorGroups = data.reduce((acc, item) => {
        if (!acc[item.sensor_id]) {
          acc[item.sensor_id] = { sensor: item.sensor_id, values: [] }
        }
        acc[item.sensor_id].values.push(item.value)
        return acc
      }, {})

      return Object.values(sensorGroups).map((group) => ({
        sensor: group.sensor,
        average: group.values.reduce((sum, val) => sum + val, 0) / group.values.length,
      }))
    }
  }, [data, chartType])

  const sensorIds = useMemo(() => {
    return [...new Set(data.map((item) => item.sensor_id))]
  }, [data])

  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

  if (data.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            No data available for visualization
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Data Visualization</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => onChartTypeChange("line")}
              variant={chartType === "line" ? "default" : "outline"}
              size="sm"
            >
              Line Chart
            </Button>
            <Button
              onClick={() => onChartTypeChange("bar")}
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
            >
              Bar Chart
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                {sensorIds.map((sensorId, index) => (
                  <Line
                    key={sensorId}
                    type="monotone"
                    dataKey={sensorId}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sensor" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#3B82F6" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
