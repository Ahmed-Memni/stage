"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Header } from "@/components/header"
import { ProtocolTabs } from "@/components/protocol-tabs"
import { LiveMonitor } from "@/components/live-monitor"
import { MessageTable } from "@/components/message-table"
import { StatisticsCards } from "@/components/statistics-cards"
import { FilterControls } from "@/components/filter-controls"
import { NetworkTopology } from "@/components/network-topology"
import { SequenceDiagram } from "@/components/sequence-diagram"
import { CommunicationFlow } from "@/components/communication-flow"
import { AlertSystem } from "@/components/alert-system"
import { AlertDashboard } from "@/components/alert-dashboard"
import { ErrorAlert } from "@/components/error-alert"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ecuCommunicationService } from "@/lib/ecu-communication-service"
import type { UnifiedMessage, MessageFilter, Alert } from "@/types/ecu-types"
import KPIDashboard from "@/components/kpi-dashboard"
import { Card } from "@/components/ui/card"

export default function ECUCommunicationAnalyzer() {
  const [darkMode, setDarkMode] = useState(false)
  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isFileData, setIsFileData] = useState(false)
  const [activeTab, setActiveTab] = useState("live")
  const [filters, setFilters] = useState<MessageFilter>({
    protocol: "all",
    messageType: "all",
    sourceVM: "all",
    destinationVM: "all",
    timeRange: "all", // Changed from "1hour" to "all"
  })

  useEffect(() => {
    document.title = "Renault SDV ECU Analyzer"
  }, [])

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Filter messages based on current filters
  const filteredMessages = useMemo(() => {
    let filtered = [...messages]
    if (filters.protocol !== "all") {
      filtered = filtered.filter((msg) => msg.protocol === filters.protocol)
    }
    if (filters.messageType !== "all") {
      filtered = filtered.filter((msg) => msg.type === filters.messageType)
    }
    if (filters.sourceVM !== "all") {
      filtered = filtered.filter((msg) => msg.source_vm === filters.sourceVM)
    }
    if (filters.destinationVM !== "all") {
      filtered = filtered.filter((msg) => msg.destination_vm === filters.destinationVM)
    }
    if (filters.timeRange !== "all") {
      const now = new Date()
      let cutoffTime: Date
      switch (filters.timeRange) {
        case "5min":
          cutoffTime = new Date(now.getTime() - 5 * 60 * 1000)
          break
        case "1hour":
          cutoffTime = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case "24hour":
          cutoffTime = new Date(now.getTime() - 24 * 60 * 1000)
          break
        default:
          cutoffTime = new Date(0)
      }
      filtered = filtered.filter((msg) => new Date(msg.timestamp) >= cutoffTime)
    }
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [messages, filters])

  // Start/stop monitoring or load file messages
  const toggleMonitoring = useCallback(async (newMessages?: UnifiedMessage[]) => {
    if (isMonitoring) {
      ecuCommunicationService.stopMonitoring()
      setMessages([])
      setIsMonitoring(false)
      setIsFileData(false)
    } else if (newMessages) {
      setMessages(newMessages.slice(0, 1000))
      setIsMonitoring(true)
      setIsFileData(true)
      setError(null)
    } else {
      try {
        setError(null)
        setMessages([])
        setIsFileData(false)
        await ecuCommunicationService.startMonitoring((newMessages) => {
          setMessages((prev) => [...newMessages, ...prev].slice(0, 1000))
        })
        setIsMonitoring(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start monitoring")
      }
    }
  }, [isMonitoring])

  // Load historical data
  const loadHistoricalData = useCallback(async () => {
    setLoading(true)
    try {
      const historicalMessages = await ecuCommunicationService.loadHistoricalData()
      setMessages(historicalMessages)
      setIsFileData(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load historical data")
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data on component mount
  useEffect(() => {
    loadHistoricalData()
  }, [loadHistoricalData])

  const toggleDarkMode = () => setDarkMode(!darkMode)
  const dismissError = () => setError(null)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        isMonitoring={isMonitoring}
        onToggleMonitoring={toggleMonitoring}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorAlert error={error} onDismiss={dismissError} />
        <FilterControls filters={filters} onFiltersChange={setFilters} messages={messages} />
        <AlertDashboard messages={filteredMessages} alerts={alerts} />
        {/* <AlertSystem messages={filteredMessages} isMonitoring={isMonitoring} /> */}
        <StatisticsCards messages={filteredMessages} />
        <ProtocolTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {activeTab === "monitor" && (
              <>
                <LiveMonitor messages={filteredMessages.slice(0, 20)} isMonitoring={isMonitoring} />
                <SequenceDiagram messages={filteredMessages} isRealTime={isMonitoring} />
              </>
            )}
            {activeTab === "topology" && (
              <>
                <NetworkTopology messages={filteredMessages} />
                <CommunicationFlow messages={filteredMessages} />
              </>
            )}
            {activeTab === "messages" && <MessageTable messages={filteredMessages} />}
            {activeTab === "Kpi" && (
              <div className="mt-6">
                <Card>
                  <KPIDashboard />
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}