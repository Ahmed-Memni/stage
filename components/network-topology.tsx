"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UnifiedMessage } from "@/types/ecu-types"

interface NetworkTopologyProps {
  messages: UnifiedMessage[]
}

export function NetworkTopology({ messages }: NetworkTopologyProps) {
  const topology = useMemo(() => {
    const nodes = new Set<string>()
    const connections = new Map<string, { count: number; protocols: Set<string> }>()

    messages.forEach((msg) => {
      nodes.add(msg.source_vm)
      nodes.add(msg.destination_vm)

      const connectionKey = `${msg.source_vm}->${msg.destination_vm}`
      if (!connections.has(connectionKey)) {
        connections.set(connectionKey, { count: 0, protocols: new Set() })
      }
      const connection = connections.get(connectionKey)!
      connection.count++
      connection.protocols.add(msg.protocol)
    })

    return { nodes: Array.from(nodes), connections }
  }, [messages])

  const getNodeColor = (node: string) => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500"]
    return colors[node.charCodeAt(0) % colors.length]
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Network Topology</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Nodes */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Virtual Machines ({topology.nodes.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {topology.nodes.map((node) => (
                <div key={node} className={`px-4 py-2 rounded-lg text-white font-medium ${getNodeColor(node)}`}>
                  {node}
                </div>
              ))}
            </div>
          </div>

          {/* Connections */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Communication Paths ({topology.connections.size})
            </h3>
            <div className="space-y-2">
              {Array.from(topology.connections.entries()).map(([connection, data]) => {
                const [source, destination] = connection.split("->")
                return (
                  <div
                    key={connection}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded text-white text-sm ${getNodeColor(source)}`}>{source}</div>
                      <span className="text-gray-400">→</span>
                      <div className={`px-2 py-1 rounded text-white text-sm ${getNodeColor(destination)}`}>
                        {destination}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">{data.count} messages</div>
                      <div className="flex space-x-1">
                        {Array.from(data.protocols).map((protocol) => (
                          <span
                            key={protocol}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              protocol === "UART"
                                ? "bg-blue-100 text-blue-800"
                                : protocol === "SOMEIP"
                                  ? "bg-green-100 text-green-800"
                                  : protocol === "CAN"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {protocol}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
