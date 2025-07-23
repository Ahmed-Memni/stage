"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Bell, BellOff, Settings, X, CheckCircle, XCircle, Clock } from "lucide-react"
import type { UnifiedMessage, Alert, AlertRule, AlertSeverity } from "@/types/ecu-types"

interface AlertSystemProps {
  messages: UnifiedMessage[]
  isMonitoring: boolean
}

export function AlertSystem({ messages, isMonitoring }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: "error-rate",
      name: "High Error Rate",
      description: "Triggers when error rate exceeds threshold",
      enabled: true,
      severity: "HIGH",
      type: "error_rate",
      threshold: 10, // 10% error rate
      timeWindow: 300, // 5 minutes
    },
    {
      id: "missing-heartbeat",
      name: "Missing Heartbeat",
      description: "Triggers when heartbeat is missing for too long",
      enabled: true,
      severity: "CRITICAL",
      type: "missing_heartbeat",
      threshold: 30, // 30 seconds
      timeWindow: 60,
    },
    {
      id: "communication-failure",
      name: "Communication Failure",
      description: "Triggers when VM stops communicating",
      enabled: true,
      severity: "HIGH",
      type: "communication_failure",
      threshold: 60, // 60 seconds without messages
      timeWindow: 120,
    },
    {
      id: "protocol-anomaly",
      name: "Protocol Anomaly",
      description: "Triggers on unusual protocol patterns",
      enabled: true,
      severity: "MEDIUM",
      type: "protocol_anomaly",
      threshold: 5, // 5 consecutive failures
      timeWindow: 180,
    },
    {
      id: "message-flood",
      name: "Message Flooding",
      description: "Triggers when message rate is too high",
      enabled: true,
      severity: "MEDIUM",
      type: "message_flood",
      threshold: 100, // 100 messages per minute
      timeWindow: 60,
    },
  ])
  const [showSettings, setShowSettings] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Check for alerts based on current messages and rules
  useEffect(() => {
    if (!isMonitoring || messages.length === 0) return

    const newAlerts: Alert[] = []
    const now = new Date()

    alertRules.forEach((rule) => {
      if (!rule.enabled) return

      const windowStart = new Date(now.getTime() - rule.timeWindow * 1000)
      const recentMessages = messages.filter((msg) => new Date(msg.timestamp) >= windowStart)

      switch (rule.type) {
        case "error_rate":
          checkErrorRate(rule, recentMessages, newAlerts, now)
          break
        case "missing_heartbeat":
          checkMissingHeartbeat(rule, recentMessages, newAlerts, now)
          break
        case "communication_failure":
          checkCommunicationFailure(rule, recentMessages, newAlerts, now)
          break
        case "protocol_anomaly":
          checkProtocolAnomaly(rule, recentMessages, newAlerts, now)
          break
        case "message_flood":
          checkMessageFlood(rule, recentMessages, newAlerts, now)
          break
      }
    })

    // Add new alerts and play sound if enabled
    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 100)) // Keep last 100 alerts
      setUnreadCount((prev) => prev + newAlerts.length)

      if (soundEnabled) {
        playAlertSound(newAlerts[0].severity)
      }
    }
  }, [messages, alertRules, isMonitoring, soundEnabled])

  const checkErrorRate = (rule: AlertRule, messages: UnifiedMessage[], alerts: Alert[], timestamp: Date) => {
    const errorMessages = messages.filter((msg) => msg.type === "ERROR_CODE" || msg.type === "NACK")
    const errorRate = messages.length > 0 ? (errorMessages.length / messages.length) * 100 : 0

    if (errorRate > rule.threshold) {
      alerts.push({
        id: `${rule.id}-${timestamp.getTime()}`,
        ruleId: rule.id,
        title: rule.name,
        message: `Error rate is ${errorRate.toFixed(1)}% (threshold: ${rule.threshold}%)`,
        severity: rule.severity,
        timestamp: timestamp.toISOString(),
        acknowledged: false,
        data: {
          errorRate,
          threshold: rule.threshold,
          totalMessages: messages.length,
          errorMessages: errorMessages.length,
        },
      })
    }
  }

  const checkMissingHeartbeat = (rule: AlertRule, messages: UnifiedMessage[], alerts: Alert[], timestamp: Date) => {
    const vms = [...new Set(messages.map((msg) => msg.source_vm))]
    const thresholdTime = new Date(timestamp.getTime() - rule.threshold * 1000)

    vms.forEach((vm) => {
      const lastHeartbeat = messages
        .filter((msg) => msg.source_vm === vm && msg.type === "HEARTBEAT")
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

      if (!lastHeartbeat || new Date(lastHeartbeat.timestamp) < thresholdTime) {
        alerts.push({
          id: `${rule.id}-${vm}-${timestamp.getTime()}`,
          ruleId: rule.id,
          title: `${rule.name} - ${vm}`,
          message: `No heartbeat received from ${vm} for over ${rule.threshold} seconds`,
          severity: rule.severity,
          timestamp: timestamp.toISOString(),
          acknowledged: false,
          data: {
            vm,
            lastHeartbeat: lastHeartbeat?.timestamp,
            threshold: rule.threshold,
          },
        })
      }
    })
  }

  const checkCommunicationFailure = (rule: AlertRule, messages: UnifiedMessage[], alerts: Alert[], timestamp: Date) => {
    const vms = [...new Set([...messages.map((msg) => msg.source_vm), ...messages.map((msg) => msg.destination_vm)])]
    const thresholdTime = new Date(timestamp.getTime() - rule.threshold * 1000)

    vms.forEach((vm) => {
      const lastMessage = messages
        .filter((msg) => msg.source_vm === vm || msg.destination_vm === vm)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

      if (!lastMessage || new Date(lastMessage.timestamp) < thresholdTime) {
        alerts.push({
          id: `${rule.id}-${vm}-${timestamp.getTime()}`,
          ruleId: rule.id,
          title: `${rule.name} - ${vm}`,
          message: `No communication from/to ${vm} for over ${rule.threshold} seconds`,
          severity: rule.severity,
          timestamp: timestamp.toISOString(),
          acknowledged: false,
          data: {
            vm,
            lastMessage: lastMessage?.timestamp,
            threshold: rule.threshold,
          },
        })
      }
    })
  }

  const checkProtocolAnomaly = (rule: AlertRule, messages: UnifiedMessage[], alerts: Alert[], timestamp: Date) => {
    // Check for consecutive NACK messages
    const recentMessages = messages.slice(0, rule.threshold)
    const consecutiveNacks = recentMessages.filter((msg) => msg.type === "NACK").length

    if (consecutiveNacks >= rule.threshold) {
      alerts.push({
        id: `${rule.id}-${timestamp.getTime()}`,
        ruleId: rule.id,
        title: rule.name,
        message: `${consecutiveNacks} consecutive NACK messages detected`,
        severity: rule.severity,
        timestamp: timestamp.toISOString(),
        acknowledged: false,
        data: {
          consecutiveNacks,
          threshold: rule.threshold,
        },
      })
    }
  }

  const checkMessageFlood = (rule: AlertRule, messages: UnifiedMessage[], alerts: Alert[], timestamp: Date) => {
    const messagesPerMinute = (messages.length / rule.timeWindow) * 60

    if (messagesPerMinute > rule.threshold) {
      alerts.push({
        id: `${rule.id}-${timestamp.getTime()}`,
        ruleId: rule.id,
        title: rule.name,
        message: `High message rate: ${messagesPerMinute.toFixed(1)} msg/min (threshold: ${rule.threshold})`,
        severity: rule.severity,
        timestamp: timestamp.toISOString(),
        acknowledged: false,
        data: {
          messagesPerMinute,
          threshold: rule.threshold,
        },
      })
    }
  }

  const playAlertSound = (severity: AlertSeverity) => {
    // Create audio context and play different tones based on severity
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Different frequencies for different severities
    const frequencies = {
      LOW: 440,
      MEDIUM: 554,
      HIGH: 659,
      CRITICAL: 880,
    }

    oscillator.frequency.setValueAtTime(frequencies[severity], audioContext.currentTime)
    oscillator.type = severity === "CRITICAL" ? "sawtooth" : "sine"

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const acknowledgeAll = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, acknowledged: true })))
    setUnreadCount(0)
  }

  const clearAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  const updateAlertRule = (ruleId: string, updates: Partial<AlertRule>) => {
    setAlertRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)))
  }

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case "LOW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "CRITICAL":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
  }

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "LOW":
        return <CheckCircle className="h-4 w-4" />
      case "MEDIUM":
        return <Clock className="h-4 w-4" />
      case "HIGH":
        return <AlertTriangle className="h-4 w-4" />
      case "CRITICAL":
        return <XCircle className="h-4 w-4" />
    }
  }

  const activeAlerts = alerts.filter((alert) => !alert.acknowledged)
  const acknowledgedAlerts = alerts.filter((alert) => alert.acknowledged)

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert System
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={acknowledgeAll} disabled={activeAlerts.length === 0}>
              Acknowledge All
            </Button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Alert Settings</DialogTitle>
                </DialogHeader>
                <AlertSettings
                  rules={alertRules}
                  onUpdateRule={updateAlertRule}
                  soundEnabled={soundEnabled}
                  onSoundToggle={setSoundEnabled}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Active Alerts ({activeAlerts.length})
              </h3>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {activeAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={acknowledgeAlert}
                      onClear={clearAlert}
                      getSeverityColor={getSeverityColor}
                      getSeverityIcon={getSeverityIcon}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Acknowledged Alerts */}
          {acknowledgedAlerts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recent Alerts ({acknowledgedAlerts.slice(0, 10).length})
              </h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {acknowledgedAlerts.slice(0, 10).map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={acknowledgeAlert}
                      onClear={clearAlert}
                      getSeverityColor={getSeverityColor}
                      getSeverityIcon={getSeverityIcon}
                      isAcknowledged
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* No Alerts */}
          {alerts.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No alerts detected</p>
              <p className="text-sm">System is operating normally</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface AlertCardProps {
  alert: Alert
  onAcknowledge: (id: string) => void
  onClear: (id: string) => void
  getSeverityColor: (severity: AlertSeverity) => string
  getSeverityIcon: (severity: AlertSeverity) => React.ReactNode
  isAcknowledged?: boolean
}

function AlertCard({
  alert,
  onAcknowledge,
  onClear,
  getSeverityColor,
  getSeverityIcon,
  isAcknowledged = false,
}: AlertCardProps) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        isAcknowledged
          ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75"
          : "bg-white dark:bg-gray-900 border-red-200 dark:border-red-700"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            <Badge className={getSeverityColor(alert.severity)}>
              <div className="flex items-center gap-1">
                {getSeverityIcon(alert.severity)}
                {alert.severity}
              </div>
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">{alert.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.message}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          {!isAcknowledged && (
            <Button variant="ghost" size="sm" onClick={() => onAcknowledge(alert.id)} title="Acknowledge">
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onClear(alert.id)} title="Clear">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface AlertSettingsProps {
  rules: AlertRule[]
  onUpdateRule: (ruleId: string, updates: Partial<AlertRule>) => void
  soundEnabled: boolean
  onSoundToggle: (enabled: boolean) => void
}

function AlertSettings({ rules, onUpdateRule, soundEnabled, onSoundToggle }: AlertSettingsProps) {
  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div>
        <h3 className="text-lg font-medium mb-4">General Settings</h3>
        <div className="flex items-center space-x-2">
          <Switch checked={soundEnabled} onCheckedChange={onSoundToggle} />
          <Label>Enable sound notifications</Label>
          {soundEnabled ? <Bell className="h-4 w-4 text-green-500" /> : <BellOff className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      {/* Alert Rules */}
      <div>
        <h3 className="text-lg font-medium mb-4">Alert Rules</h3>
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input value={rule.name} onChange={(e) => onUpdateRule(rule.id, { name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select
                      value={rule.severity}
                      onValueChange={(value: AlertSeverity) => onUpdateRule(rule.id, { severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Threshold</Label>
                    <Input
                      type="number"
                      value={rule.threshold}
                      onChange={(e) => onUpdateRule(rule.id, { threshold: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Window (s)</Label>
                    <Input
                      type="number"
                      value={rule.timeWindow}
                      onChange={(e) => onUpdateRule(rule.id, { timeWindow: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch checked={rule.enabled} onCheckedChange={(enabled) => onUpdateRule(rule.id, { enabled })} />
                    <Label>Enabled</Label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
