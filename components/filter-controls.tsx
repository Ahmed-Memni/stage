"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UnifiedMessage, MessageFilter } from "@/types/ecu-types"

interface FilterControlsProps {
  filters: MessageFilter
  onFiltersChange: (filters: MessageFilter) => void
  messages: UnifiedMessage[]
}

export function FilterControls({ filters, onFiltersChange, messages }: FilterControlsProps) {
  const { protocols, messageTypes, sourceVMs, destinationVMs } = useMemo(() => {
    const protocols = [...new Set(messages.map((msg) => msg.protocol))].sort()
    const messageTypes = [...new Set(messages.map((msg) => msg.type))].sort()
    const sourceVMs = [...new Set(messages.map((msg) => msg.source_vm))].sort()
    const destinationVMs = [...new Set(messages.map((msg) => msg.destination_vm))].sort()

    return { protocols, messageTypes, sourceVMs, destinationVMs }
  }, [messages])

  const timeRanges = [
    { value: "all", label: "All Time" },
    { value: "5min", label: "Last 5 Minutes" },
    { value: "1hour", label: "Last Hour" },
    { value: "24hour", label: "Last 24 Hours" },
  ]

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Protocol</label>
            <Select
              value={filters.protocol}
              onValueChange={(value) => onFiltersChange({ ...filters, protocol: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Protocols" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Protocols</SelectItem>
                {protocols.map((protocol) => (
                  <SelectItem key={protocol} value={protocol}>
                    {protocol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Message Type</label>
            <Select
              value={filters.messageType}
              onValueChange={(value) => onFiltersChange({ ...filters, messageType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {messageTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Source VM</label>
            <Select
              value={filters.sourceVM}
              onValueChange={(value) => onFiltersChange({ ...filters, sourceVM: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sourceVMs.map((vm) => (
                  <SelectItem key={vm} value={vm}>
                    {vm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Destination VM</label>
            <Select
              value={filters.destinationVM}
              onValueChange={(value) => onFiltersChange({ ...filters, destinationVM: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Destinations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Destinations</SelectItem>
                {destinationVMs.map((vm) => (
                  <SelectItem key={vm} value={vm}>
                    {vm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Time Range</label>
            <Select
              value={filters.timeRange}
              onValueChange={(value) => onFiltersChange({ ...filters, timeRange: value })}
            >
              <SelectTrigger>
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
        </div>
      </CardContent>
    </Card>
  )
}
