"use client"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, AlertTriangle, Shield } from "lucide-react"
import type { UnifiedMessage, Alert } from "@/types/ecu-types"
interface AlertDashboardProps {
  messages: UnifiedMessage[]
  alerts: Alert[]
}
export function AlertDashboard({ messages, alerts }: AlertDashboardProps) {
  const metrics = useMemo(() => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    // messages and alerts
    const recentMessages = messages
    const recentAlerts = alerts
    const dailyAlerts = alerts
    // Error rate calculation
    const errorMessages = recentMessages.filter((msg) => msg.type === "ERROR_CODE" || msg.type === "NACK")
    const errorRate = recentMessages.length > 0 ? (errorMessages.length / recentMessages.length) * 100 : 0
    // System health score (0-100)
    let healthScore = 100
    healthScore -= Math.min(errorRate * 2, 30) // Max 30 points for error rate
    healthScore -= Math.min(recentAlerts.length * 5, 40) // Max 40 points for alerts
    healthScore -= Math.min(recentMessages.filter((msg) => msg.type === "COMMUNICATION_FAILURE").length * 10, 30) // Max 30 points for comm failures
    // Alert severity breakdown
    const alertSeverityCount = recentAlerts.reduce(
      (acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // VM health status
    const vmHealth = [...new Set(messages.map((msg) => msg.source_vm))].map((vm) => {
      const vmMessages = recentMessages.filter((msg) => msg.source_vm === vm)
      const vmErrors = vmMessages.filter((msg) => msg.type === "ERROR_CODE" || msg.type === "NACK")
      const vmErrorRate = vmMessages.length > 0 ? (vmErrors.length / vmMessages.length) * 100 : 0
      const lastMessage = vmMessages.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )[0]
      const isActive = lastMessage // Active in last 5 minutes

      return {
        vm,
        errorRate: vmErrorRate,
        messageCount: vmMessages.length,
        isActive,
        status: vmErrorRate > 10 ? "error" : vmErrorRate > 5 ? "warning" : "healthy",
      }
    })

    return {
      healthScore: Math.max(0, Math.round(healthScore)),
      errorRate,
      recentAlerts: recentAlerts.length,
      dailyAlerts: dailyAlerts.length,
      alertSeverityCount,
      vmHealth,
      totalMessages: recentMessages.length,
      activeVMs: vmHealth.filter((vm) => vm.isActive).length,
    }
  }, [messages, alerts])

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }
  const getHealthIcon = (score: number) => {
    if (score >= 80) return <Shield className="h-5 w-5 text-green-600" />
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    return <AlertTriangle className="h-5 w-5 text-red-600" />
  }
  const getVMStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* System Health Score */}
      {/* <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Health</p>
              <p className={`text-2xl font-bold ${getHealthColor(metrics.healthScore)}`}>{metrics.healthScore}%</p>
            </div>
            {getHealthIcon(metrics.healthScore)}
          </div>
          <Progress value={metrics.healthScore} className="mt-2" />
        </CardContent>
      </Card> */}

      {/* Error Rate */}
      {/* <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
              <p className={`text-2xl font-bold ${metrics.errorRate > 5 ? "text-red-600" : "text-green-600"}`}>
                {metrics.errorRate.toFixed(1)}%
              </p>
            </div>
            {metrics.errorRate > 5 ? (
              <TrendingUp className="h-5 w-5 text-red-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-600" />
            )}
          </div>
        </CardContent>
      </Card> */}

      {/* Recent Alerts */}
      {/* <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alerts (1h)</p>
              <p className={`text-2xl font-bold ${metrics.recentAlerts > 0 ? "text-orange-600" : "text-green-600"}`}>
                {metrics.recentAlerts}
              </p>
            </div>
            <AlertTriangle className={`h-5 w-5 ${metrics.recentAlerts > 0 ? "text-orange-600" : "text-gray-400"}`} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{metrics.dailyAlerts}</p>
        </CardContent>
      </Card> */}

      {/* Active VMs */}
      {/* Uncomment this section if you want to display active VMs
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active VMs</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.activeVMs}</p>
            </div>
            <div className="text-2xl">🖥️</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{metrics.totalMessages} messages</p>
        </CardContent>
      </Card> */}

      {/* Alert Severity Breakdown */}
      {/* <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Alert Severity Distribution (Last Hour)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metrics.alertSeverityCount).map(([severity, count]) => (
              <Badge
                key={severity}
                variant="outline"
                className={
                  severity === "CRITICAL"
                    ? "border-red-500 text-red-700"
                    : severity === "HIGH"
                      ? "border-orange-500 text-orange-700"
                      : severity === "MEDIUM"
                        ? "border-yellow-500 text-yellow-700"
                        : "border-blue-500 text-blue-700"
                }
              >
                {severity}: {count}
              </Badge>
            ))}
            {Object.keys(metrics.alertSeverityCount).length === 0 && (
              <span className="text-sm text-gray-500">No alerts in the last hour</span>
            )}
          </div>
        </CardContent>
      </Card> */}

      {/* VM Health Status */}
      <Card className="md:col-span-6">
        <CardHeader>
          <CardTitle className="text-sm">VM Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.vmHealth.map((vm) => (
              <div key={vm.vm} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{vm.vm}</span>
                  <Badge className={getVMStatusColor(vm.status)}>{vm.status}</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {vm.messageCount} msgs, {vm.errorRate.toFixed(1)}% errors
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}