"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import type { BootKPI, KPIStatus } from "./types/kpi-types"

interface KPICardProps {
  title: string
  kpis: BootKPI[]
  currentStatuses?: KPIStatus[]
  onStatusesUpdate?: (updated: KPIStatus[]) => void
  onRefresh?: () => Promise<BootKPI[]>
}

export default function KPICard({
  title,
  kpis,
  onRefresh,
  currentStatuses = [],
  onStatusesUpdate,
}: KPICardProps) {
  const [loading, setLoading] = useState(false)
  const [kpiStatuses, setKpiStatuses] = useState<KPIStatus[]>(currentStatuses)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentStatuses.length === 0) {
      setKpiStatuses(
        kpis.map((kpi) => ({
          name: kpi.BootKpiName || kpi.SimplifiedPattern || "Unnamed KPI",
          status: "unknown",
          targetValue: kpi.target || "N/A",
          actualValue: undefined,
          lastChecked: "Never",
          reason: "",
        }))
      )
    } else {
      setKpiStatuses(currentStatuses)
    }
  }, [kpis, currentStatuses])

  const extractLogLinesWithWords = (rawLogText: string, words: string[]): string => {
    const lines = rawLogText.split("\n").map((line) => line.trim())
    const blocks: string[] = []

    for (const word of words) {
      if (!word) continue

      const matchingLines = lines.filter((line) =>
        new RegExp(`\\b${word}\\b`, "i").test(line)
      )

      if (matchingLines.length > 0) {
        blocks.push(`--- Log lines containing the word: '${word}' ---`)
        blocks.push(...matchingLines)
        blocks.push(`--- End of search for: '${word}' ---\n`)
      }
    }

    return blocks.join("\n")
  }

  // Preprocess log lines: convert timestamps like "06-26 15:53:39.204590" into microseconds + [us] format
  const preprocessLogs = (logContent: string): string => {
    const lines = logContent.split("\n").map((line) => line.trim()).filter(Boolean)
    const processedLines: string[] = []
    let currentPattern: string | null = null

    // Map simplified pattern to full pattern for header lines
    const patternMap: { [key: string]: string } = {}
    kpis.forEach((kpi) => {
      if (kpi.SimplifiedPattern) {
        patternMap[kpi.SimplifiedPattern] = kpi.BootKpiSearchPattern
      }
    })

    for (const line of lines) {
      // Detect header line and replace simplified pattern with full pattern
      const headerMatch = line.match(/--- Log lines (?:containing the word|matching regex pattern): '(.+?)' ---/)
      if (headerMatch) {
        currentPattern = headerMatch[1]
        currentPattern = patternMap[currentPattern] || currentPattern
        processedLines.push(line.replace(headerMatch[1], currentPattern))
        continue
      }

      if (line.startsWith("--- End of search for:")) {
        processedLines.push(line)
        currentPattern = null
        continue
      }

      if (currentPattern) {
        // Check if line already has microseconds format
        const usMatch = line.match(/(\d+)\[us\]/)
        if (usMatch) {
          processedLines.push(line)
          continue
        }

        // Match timestamp in format MM-DD HH:mm:ss.milliseconds (3 to 6 digits)
        const timeMatch = line.match(/^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3,6})/)
        if (timeMatch) {
          const timeStr = timeMatch[1] // e.g. "06-26 15:53:39.204590"

          // Extract time part HH:mm:ss.milliseconds
          const [_, timePart] = timeStr.split(" ")
          const [hours, minutes, secondsFraction] = timePart.split(":")
          const [seconds, fraction] = secondsFraction.split(".")

          const hoursNum = Number(hours)
          const minutesNum = Number(minutes)
          const secondsNum = Number(seconds)
          const fractionStr = fraction.padEnd(6, "0") // pad to microseconds (6 digits)

          // Convert everything to microseconds
          const timestampUs =
            (hoursNum * 3600 + minutesNum * 60 + secondsNum) * 1_000_000 +
            Number(fractionStr)

          // Replace original timestamp with microseconds + [us]
          const newLine = line.replace(timeMatch[1], `${timestampUs}[us]`)
          processedLines.push(newLine)
        } else {
          // no timestamp at start of line, keep as is
          processedLines.push(line)
        }
      }
    }

    return processedLines.join("\n")
  }

  // Evaluate KPIs picking the line with MINIMUM timestamp for each KPI
  const evaluateKpiPassFail = (logContent: string): KPIStatus[] => {
    const lines = logContent.split("\n").map((line) => line.trim()).filter(Boolean)
    const matches: { [key: string]: string[] } = {}
    let currentPattern: string | null = null

    for (const line of lines) {
      const startMatch = line.match(/--- Log lines (?:containing the word|matching regex pattern): '(.+?)' ---/)
      if (startMatch) {
        currentPattern = startMatch[1]
        if (!matches[currentPattern]) matches[currentPattern] = []
        continue
      }
      if (line.startsWith("--- End of search for:")) {
        currentPattern = null
        continue
      }
      if (currentPattern) {
        matches[currentPattern].push(line)
      }
    }

    return kpis.map((kpi) => {
      const pattern = kpi.BootKpiSearchPattern
      const patternMatches = matches[pattern] || []
      const regex = new RegExp(pattern, "i")
      const target = kpi.target || ""
      const shouldFail = kpi.shouldFail !== undefined ? kpi.shouldFail : true

      // Filter lines matching the pattern regex
      const kpiMatches = patternMatches.filter((line) => regex.test(line))

      // Find the line with the minimum timestamp (in microseconds)
      let minTimestampUs: number | undefined = undefined
      let minTimestampLine: string | undefined = undefined

      for (const line of kpiMatches) {
        const timeMatch = line.match(/(\d+)\[us\]/)
        if (timeMatch) {
          const ts = parseInt(timeMatch[1])
          if (minTimestampUs === undefined || ts < minTimestampUs) {
            minTimestampUs = ts
            minTimestampLine = line
          }
        }
      }

      const timestampSec = minTimestampUs !== undefined ? minTimestampUs / 1_000_000 : undefined

      if (target && !isNaN(parseFloat(target))) {
        const targetSec = parseFloat(target)
        if (timestampSec !== undefined) {
          const status = shouldFail
            ? timestampSec > targetSec ? "pass" : "fail"
            : timestampSec <= targetSec ? "pass" : "fail"

          return {
            name: kpi.BootKpiName || kpi.SimplifiedPattern || "Unnamed KPI",
            status,
            actualValue: timestampSec.toFixed(6),
            targetValue: target,
            lastChecked: new Date().toLocaleTimeString(),
            reason: status === "pass"
              ? `Timestamp ${timestampSec.toFixed(6)}s ${shouldFail ? "exceeds" : "within"} target ${targetSec}s`
              : `Timestamp ${timestampSec.toFixed(6)}s ${shouldFail ? "within" : "exceeds"} target ${targetSec}s`
          }
        }

        // No timestamp found but target exists
        const status = shouldFail ? "pass" : "fail"
        return {
          name: kpi.BootKpiName || kpi.SimplifiedPattern || "Unnamed KPI",
          status,
          actualValue: undefined,
          targetValue: target,
          lastChecked: new Date().toLocaleTimeString(),
          reason: `No timestamp found for '${pattern}'`,
        }
      }

      // No target defined - simple presence or absence
      const status = shouldFail
        ? kpiMatches.length > 0 ? "fail" : "pass"
        : kpiMatches.length > 0 ? "pass" : "fail"

      return {
        name: kpi.BootKpiName || kpi.SimplifiedPattern || "Unnamed KPI",
        status,
        actualValue: timestampSec?.toFixed(6),
        targetValue: target || "N/A",
        lastChecked: new Date().toLocaleTimeString(),
        reason: kpiMatches.length > 0
          ? `Match found for '${pattern}'`
          : `No match found for '${pattern}'`
      }
    })
  }

  const refreshKPIs = async () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setLoading(true)
    try {
      let combinedText = ""
      for (const file of files) {
        const content = await file.text()
        combinedText += `\n--- Contents of ${file.name} ---\n${content}\n`
      }

      const simplifiedPatterns = kpis.map((kpi) => kpi.SimplifiedPattern).filter(Boolean) as string[]
      const extractedText = extractLogLinesWithWords(combinedText, simplifiedPatterns)
      const processedText = preprocessLogs(extractedText)

      // Debug: check that timestamps have been converted
      console.log("Processed log lines:\n", processedText)

      const updatedStatuses = evaluateKpiPassFail(processedText)
      setKpiStatuses(updatedStatuses)
      onStatusesUpdate?.(updatedStatuses)
      fileInputRef.current!.value = ""
      if (onRefresh) await onRefresh()
    } catch (error) {
      console.error("Failed to process log files:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "fail": return <XCircle className="h-4 w-4 text-red-600" />
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: "default",
      fail: "destructive",
      pending: "secondary",
      unknown: "outline",
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status.toUpperCase()}</Badge>
  }

  const passCount = kpiStatuses.filter((kpi) => kpi.status === "pass").length
  const failCount = kpiStatuses.filter((kpi) => kpi.status === "fail").length
  const totalCount = kpiStatuses.length

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-sm text-muted-foreground">{passCount}/{totalCount} passing</span>
            {failCount > 0 && <span className="text-sm text-red-600">{failCount} failing</span>}
          </div>
        </div>
        <div>
          <input type="file" ref={fileInputRef} className="hidden" accept=".txt" multiple onChange={handleFileChange} />
          <Button variant="outline" size="sm" onClick={refreshKPIs} disabled={loading} className="flex items-center space-x-2 bg-transparent">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {kpiStatuses.map((kpi, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(kpi.status)}
                <div>
                  <p className="font-medium text-sm">{kpi.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Target: {kpi.targetValue}
                    {kpi.actualValue && ` | Actual: ${kpi.actualValue}s`}
                    {kpi.reason && ` | Reason: ${kpi.reason}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">{getStatusBadge(kpi.status)}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">Last updated: {kpiStatuses[0]?.lastChecked || "Never"}</p>
        </div>
      </CardContent>
    </Card>
  )
}
