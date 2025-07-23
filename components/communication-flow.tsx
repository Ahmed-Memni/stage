"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Activity, Zap, Shield, Smartphone, Cpu, Layers, Boxes, HardDrive, ShieldCheck, } from "lucide-react"
import type { UnifiedMessage } from "@/types/ecu-types"

interface CommunicationFlowProps {
  messages: UnifiedMessage[]
}

interface FlowConnection {
  from: string
  to: string
  count: number
  protocols: Set<string>
  functions: Set<string>
  lastMessage: string
}

const VM_ICONS = {
  VM1: <Cpu className="h-5 w-5" />,            // Microcontroller → Chip
  VM2: <ShieldCheck className="h-5 w-5" />,     // QNX (secure RTOS) → ShieldCheck
  VM3: <Layers className="h-5 w-5" />,          // FVM (layered isolation) → Layers
  VM4: <Boxes className="h-5 w-5" />,

}

const VM_NAMES = {

  VM1: "MCU",
  VM2: "QNX",
  VM3: "FVM",
  VM4: "RBVM",
}

const VM_COLORS = {
  VM1: "bg-orange-500",
  VM2: "bg-purple-500",
  VM3: "bg-yellow-500",
  VM4: "bg-gray-500",
}

export function CommunicationFlow({ messages }: CommunicationFlowProps) {
  const [selectedVM, setSelectedVM] = useState<string>("all")
  const [timeRange, setTimeRange] = useState("all")

  const filteredMessages = useMemo(() => {
    let filtered = messages

    // Filter by time range
    if (timeRange !== "all") {
      const now = new Date()
      let cutoffTime: Date

      switch (timeRange) {
        case "5min":
          cutoffTime = new Date(now.getTime() - 5 * 60 * 1000)
          break
        case "1hour":
          cutoffTime = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case "24hour":
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        default:
          cutoffTime = new Date(0)
      }

      filtered = filtered.filter((msg) => new Date(msg.timestamp) >= cutoffTime)
    }

    // Filter by selected VM
    if (selectedVM !== "all") {
      filtered = filtered.filter((msg) => msg.source_vm === selectedVM || msg.destination_vm === selectedVM)
    }

    return filtered
  }, [messages, timeRange, selectedVM])

  const flowConnections = useMemo(() => {
    const connections = new Map<string, FlowConnection>()

    filteredMessages.forEach((msg) => {
      const key = `${msg.source_vm}-${msg.destination_vm}`

      if (!connections.has(key)) {
        connections.set(key, {
          from: msg.source_vm,
          to: msg.destination_vm,
          count: 0,
          protocols: new Set(),
          functions: new Set(),
          lastMessage: msg.timestamp,
        })
      }

      const connection = connections.get(key)!
      connection.count++
      connection.protocols.add(msg.protocol)
      connection.functions.add(msg.payload.function || msg.type)

      if (new Date(msg.timestamp) > new Date(connection.lastMessage)) {
        connection.lastMessage = msg.timestamp
      }
    })

    return Array.from(connections.values()).sort((a, b) => b.count - a.count)
  }, [filteredMessages])

  const vmStats = useMemo(() => {
    const stats = new Map<string, { sent: number; received: number; protocols: Set<string> }>()

    filteredMessages.forEach((msg) => {
      // Source VM stats
      if (!stats.has(msg.source_vm)) {
        stats.set(msg.source_vm, { sent: 0, received: 0, protocols: new Set() })
      }
      const sourceStats = stats.get(msg.source_vm)!
      sourceStats.sent++
      sourceStats.protocols.add(msg.protocol)

      // Destination VM stats
      if (!stats.has(msg.destination_vm)) {
        stats.set(msg.destination_vm, { sent: 0, received: 0, protocols: new Set() })
      }
      const destStats = stats.get(msg.destination_vm)!
      destStats.received++
      destStats.protocols.add(msg.protocol)
    })

    return stats
  }, [filteredMessages])

  const getConnectionWidth = (count: number, maxCount: number) => {
    const minWidth = 2
    const maxWidth = 8
    return minWidth + (count / maxCount) * (maxWidth - minWidth)
  }

  const maxConnectionCount = Math.max(...flowConnections.map((conn) => conn.count), 1)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Focus VM:</label>
              <Select value={selectedVM} onValueChange={setSelectedVM}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All VMs</SelectItem>
                  <SelectItem value="VM3">VM1 - MCU</SelectItem>
                  <SelectItem value="VM4">VM2 - QNX</SelectItem>
                  <SelectItem value="VM5">VM3 - FVM</SelectItem>
                  <SelectItem value="VM6">VM4 - RBVM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Time Range:</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="5min">Last 5 Minutes</SelectItem>
                  <SelectItem value="1hour">Last Hour</SelectItem>
                  <SelectItem value="24hour">Last 24 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VM Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(VM_NAMES).map(([vmId, vmName]) => {
          const stats = vmStats.get(vmId) || { sent: 0, received: 0, protocols: new Set() }
          return (
            <Card key={vmId} className={selectedVM === vmId ? "ring-2 ring-blue-500" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full text-white ${VM_COLORS[vmId as keyof typeof VM_COLORS]}`}>
                      {VM_ICONS[vmId as keyof typeof VM_ICONS]}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{vmName}</div>
                      <div className="text-xs text-gray-500">{vmId}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sent:</span>
                    <span className="font-medium">{stats.sent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Received:</span>
                    <span className="font-medium">{stats.received}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protocols:</span>
                    <span className="font-medium">{stats.protocols.size}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Flow Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flowConnections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No communication flows found</div>
            ) : (
              flowConnections.map((connection, index) => (
                <div
                  key={`${connection.from}-${connection.to}`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Source VM */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-full text-white ${VM_COLORS[connection.from as keyof typeof VM_COLORS]}`}
                      >
                        {VM_ICONS[connection.from as keyof typeof VM_ICONS]}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{VM_NAMES[connection.from as keyof typeof VM_NAMES]}</div>
                        <div className="text-gray-500">{connection.from}</div>
                      </div>
                    </div>

                    {/* Arrow with message count */}
                    <div className="flex items-center space-x-2 flex-1">
                      <div
                        className="flex-1 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ height: `${getConnectionWidth(connection.count, maxConnectionCount)}px` }}
                      >
                        <ArrowRight className="h-3 w-3" />
                      </div>
                      <Badge variant="secondary">{connection.count} msgs</Badge>
                    </div>

                    {/* Destination VM */}
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-right">
                        <div className="font-medium">{VM_NAMES[connection.to as keyof typeof VM_NAMES]}</div>
                        <div className="text-gray-500">{connection.to}</div>
                      </div>
                      <div
                        className={`p-2 rounded-full text-white ${VM_COLORS[connection.to as keyof typeof VM_COLORS]}`}
                      >
                        {VM_ICONS[connection.to as keyof typeof VM_ICONS]}
                      </div>
                    </div>
                  </div>

                  {/* Connection Details */}
                  <div className="ml-4 text-right">
                    <div className="flex gap-1 mb-1">
                      {Array.from(connection.protocols).map((protocol) => (
                        <Badge key={protocol} variant="outline" className="text-xs">
                          {protocol}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      Last: {new Date(connection.lastMessage).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-500">{connection.functions.size} functions</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
