"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { UnifiedMessage } from "@/types/ecu-types"

interface StatisticsCardsProps {
  messages: UnifiedMessage[]
}

export function StatisticsCards({ messages }: StatisticsCardsProps) {
  const stats = useMemo(() => {
    if (messages.length === 0) {
      return {
        totalMessages: 0,
        protocolBreakdown: {},
        uniqueVMs: 0,
        errorRate: 0,
        avgMessagesPerMinute: 0,
      }
    }

    const protocolBreakdown = messages.reduce(
      (acc, msg) => {
        acc[msg.protocol] = (acc[msg.protocol] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const uniqueVMs = new Set([...messages.map((msg) => msg.source_vm), ...messages.map((msg) => msg.destination_vm)])
      .size

    const errorMessages = messages.filter((msg) => msg.type === "ERROR_CODE" || msg.type === "NACK").length

    const errorRate = messages.length > 0 ? (errorMessages / messages.length) * 100 : 0

    // Calculate messages per minute (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentMessages = messages.filter((msg) => new Date(msg.timestamp) >= oneHourAgo)
    const avgMessagesPerMinute = recentMessages.length / 60

    return {
      totalMessages: messages.length,
      protocolBreakdown,
      uniqueVMs,
      errorRate,
      avgMessagesPerMinute,
    }
  }, [messages])

  const cards = [
    {
      title: "Total Messages",
      value: stats.totalMessages.toLocaleString(),
      icon: "📊",
      color: "text-blue-600",
    },
    {
      title: "Active VMs",
      value: stats.uniqueVMs,
      icon: "🖥️",
      color: "text-green-600",
    },
    {
      title: "Error Rate",
      value: `${stats.errorRate.toFixed(1)}%`,
      icon: "⚠️",
      color: stats.errorRate > 5 ? "text-red-600" : "text-yellow-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
              <div className="text-2xl">{card.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Protocol breakdown card */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Protocol Distribution</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(stats.protocolBreakdown).map(([protocol, count]) => (
              <div key={protocol} className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${protocol === "UART"
                      ? "bg-blue-500"
                      : protocol === "SOMEIP"
                        ? "bg-green-500"
                        : protocol === "CAN"
                          ? "bg-orange-500"
                          : "bg-gray-500"
                    }`}
                />
                <span className="text-sm font-medium">{protocol}</span>
                <span className="text-sm text-gray-500">({count})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
