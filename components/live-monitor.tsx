"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { UnifiedMessage } from "@/types/ecu-types"

interface LiveMonitorProps {
  messages: UnifiedMessage[]
  isMonitoring: boolean
}

export function LiveMonitor({ messages, isMonitoring }: LiveMonitorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case "UART":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "SOMEIP":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "DIAG_REQ":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "DIAG_RESP":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      case "ERROR_CODE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "HEARTBEAT":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
      case "ACK":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      case "NACK":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Communication Monitor</span>
          <div className="flex items-center gap-2">
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96" ref={scrollRef}>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {isMonitoring ? "Waiting for Logs..." : "No lOGS"}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono min-w-[80px]">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>

                    <Badge className={getProtocolColor(message.protocol)}>{message.protocol}</Badge>

                    <Badge variant="outline" className={getMessageTypeColor(message.type)}>
                      {message.type}
                    </Badge>

                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium text-blue-600 dark:text-blue-400">{message.source_vm}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{message.destination_vm}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono max-w-xs truncate">
                    {message.raw}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
