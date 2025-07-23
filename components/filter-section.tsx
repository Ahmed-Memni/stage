"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FilterSectionProps {
  data: any[]
  filters: {
    sensorId: string
    timeRange: string
  }
  onFiltersChange: (filters: any) => void
  isPolling: boolean
  onTogglePolling: () => void
}

export function FilterSection({ data, filters, onFiltersChange, isPolling, onTogglePolling }: FilterSectionProps) {
  const sensorIds = useMemo(() => {
    const ids = [...new Set(data.map((item) => item.sensor_id))]
    return ids.sort()
  }, [data])

  const timeRanges = [
    { value: "all", label: "All Time" },
    { value: "5min", label: "Last 5 Minutes" },
    { value: "1hour", label: "Last Hour" },
    { value: "24hour", label: "Last 24 Hours" },
  ]

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sensor ID:</label>
            <Select
              value={filters.sensorId}
              onValueChange={(value) => onFiltersChange({ ...filters, sensorId: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Sensors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sensors</SelectItem>
                {sensorIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</label>
            <Select
              value={filters.timeRange}
              onValueChange={(value) => onFiltersChange({ ...filters, timeRange: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={onTogglePolling}
              variant={isPolling ? "destructive" : "default"}
              className={isPolling ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isPolling ? "Pause Updates" : "Resume Updates"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
