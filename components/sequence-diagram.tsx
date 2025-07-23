
"use client";

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, Play, Pause, RotateCcw, FileImage, FileText, ChevronDown } from "lucide-react"
import type { UnifiedMessage } from "@/types/ecu-types"

// Import Mermaid dynamically to avoid initialisation issues "bil fala9i mermaid initialization mt3 intiailisation"
let mermaid: any = null
if (typeof window !== "undefined") {
  import("mermaid").then((m) => {
    mermaid = m.default
  })
}

interface SequenceDiagramProps {
  messages: UnifiedMessage[]
  isRealTime?: boolean
}

interface VMInfo {
  id: string
  name: string
  description: string
  color: string
}

const VM_INFO: Record<string, VMInfo> = {
  VM1: { id: "VM1", name: "MCU", description: "Microcontroller - CDC Domain", color: "#FF9800" },
  VM2: { id: "VM2", name: "QNX", description: "QNX Hypervisor", color: "#9C27B0" },
  VM3: { id: "VM3", name: "FVM", description: "Android VM", color: "#FFEB3B" },
  VM4: { id: "VM4", name: "RBVM", description: "CarOs VM", color: "#9E9E9E" },
}

// icons lil protocols 
function getProtocolBadge(protocol: string) {
  const badges: Record<string, string> = { UART: " 📡", SOMEIP: " 🌐", MODE: " 🚀" } // icons for protocols 
  return badges[protocol] ?? ""
}

function getArrowType(messageType: string) {
  switch (messageType) {
    case "DIAG_REQ":
    case "CONFIG_SET": return "->>"
    case "DIAG_RESP":
    case "ACK": return "-->>"
    case "ERROR_CODE":
    case "NACK": return "-x"
    case "HEARTBEAT": return "->>"
    default: return "->>"
  }
}

export function SequenceDiagram({ messages, isRealTime = false }: SequenceDiagramProps) {
  const [timeRange, setTimeRange] = useState<number | "off">("off")
  const [hours, setHours] = useState<string>("0")
  const [minutes, setMinutes] = useState<string>("0")
  const [seconds, setSeconds] = useState<string>("0")
  const [timeError, setTimeError] = useState<string | null>(null)
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all")
  const [maxMessages, setMaxMessages] = useState<number>(999)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [showTimestamps, setShowTimestamps] = useState<boolean>(true)
  const [groupByFunction, setGroupByFunction] = useState<boolean>(false)
  const [diagramId, setDiagramId] = useState<string>(`sequence-diagram-${Date.now()}`)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const diagramRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'))
    checkDarkMode()
    const observer = new MutationObserver((mutations) => mutations.forEach(mutation => {
      if (mutation.attributeName === 'class') checkDarkMode()
    }))
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (mermaid) {
      mermaid.initialize({
        startOnLoad: false,
        theme: isDarkMode ? 'dark' : 'default',
        themeVariables: {
          primaryColor: isDarkMode ? '#38bdf8' : '#0ea5e9',
          primaryTextColor: isDarkMode ? '#f3f4f6' : '#0c4a6e',
          lineColor: isDarkMode ? '#7dd3fc' : '#0ea5e9',
          background: isDarkMode ? '#1f2937' : '#f9fafb',
          textColor: isDarkMode ? '#f3f4f6' : '#0c4a6e',
          actorBkg: isDarkMode ? '#0ea5e9' : '#38bdf8',
          actorTextColor: isDarkMode ? '#f3f4f6' : '#0c4a6e',
          actorBorder: isDarkMode ? '#0284c7' : '#075985',
          signalColor: isDarkMode ? '#f3f4f6' : '#0c4a6e',
          signalTextColor: isDarkMode ? '#f3f4f6' : '#0c4a6e',
          labelBoxBkgColor: isDarkMode ? '#1f2937' : '#f0f9ff',
          labelTextColor: isDarkMode ? '#f3f4f6' : '#0c4a6e',
          noteBkgColor: isDarkMode ? '#374151' : '#e0f2fe',
          noteTextColor: isDarkMode ? '#f3f4f6' : '#0c4a6e',
        },
        sequence: {
          diagramMarginX: 50, diagramMarginY: 10, actorMargin: 50, width: 150, height: 65, boxMargin: 10,
          boxTextMargin: 5, noteMargin: 20, messageMargin: 60, mirrorActors: false, bottomMarginAdj: 1,
          useMaxWidth: true, rightAngles: false, showSequenceNumbers: true, fontFamily: 'Inter, sans-serif',
          fontSize: '14px', maxHeight: 100000, actorHeight: 100000,
        },
      })
    }
  }, [isDarkMode])

  const updateTimeRange = (h: string, m: string, s: string) => {
    const hoursNum = parseInt(h, 10) || 0
    const minutesNum = parseInt(m, 10) || 0
    const secondsNum = parseInt(s, 10) || 0

    if (hoursNum < 0 || minutesNum < 0 || secondsNum < 0) {
      setTimeError("Please enter non-negative numbers")
      return
    }
    if (minutesNum >= 60 || secondsNum >= 60) {
      setTimeError("Minutes and seconds must be less than 60")
      return
    }

    setTimeError(null)
    const totalMs = (hoursNum * 3600 * 1000) + (minutesNum * 60 * 1000) + (secondsNum * 1000)
    setTimeRange(totalMs)
  }

  const handleTimeRangeToggle = (checked: boolean) => {
    if (checked) {
      setTimeRange("off")
      setTimeError(null)
    } else {
      updateTimeRange(hours, minutes, seconds)
    }
  }

  const filteredMessages = useMemo(() => {
    let filtered = messages.filter((msg) => VM_INFO[msg.source_vm] && VM_INFO[msg.destination_vm])

    if (selectedProtocol !== "all") filtered = filtered.filter((msg) => msg.protocol === selectedProtocol)
    if (timeRange !== "off" && typeof timeRange === "number" && timeRange > 0) {
      const cutoffTime = new Date(Date.now() - timeRange)
      filtered = filtered.filter((msg) => new Date(msg.timestamp) >= cutoffTime)
    }

    filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    const result: UnifiedMessage[] = []
    let currentGroup: UnifiedMessage[] = []
    const lastState: Record<string, { gvm: string | null; path: string | null; failure: string | null }> = {
      LA: { gvm: null, path: null, failure: null },
      LA1: { gvm: null, path: null, failure: null },
    }
    const lastSignalState: Record<string, Record<string, number>> = {
      LA: {},
      LA1: {},
      MCU: {},
    }
    let lastKey = ''

    filtered.forEach((msg, index) => {
      const component = msg.payload.component || "LA"
      const isGVMMessage = msg.payload.function?.includes("GVM up") || msg.payload.function?.includes("GVM down")
      const isPathMessage = msg.payload.function?.startsWith("Path:")
      const isFailureMessage = msg.payload.function?.startsWith("Failure open")
      const isSignalChange = Array.isArray(msg.payload.changes) && msg.payload.signals !== undefined && msg.payload.signals !== null

      let displayText = `[${msg.protocol}] ${msg.payload.function || msg.type}${getProtocolBadge(msg.protocol)}`
      let shouldAdd = false
      let modifiedFunction = msg.payload.function || msg.type

      if (isSignalChange) {
        const currentSignals = msg.payload.signals || {}
        const previousSignals = lastSignalState[component] || {}

        //  "initialisation mt3 first states of signals"
        const isFirstSignalMessage = Object.keys(previousSignals).length === 0

        if (isFirstSignalMessage) {
          // for the first message always show all signals
          shouldAdd = true
        } else {
          // For  messages, show only changed signals
          const hasChanges = msg.payload.changes.some((change: string) => {
            const [signal, value] = change.match(/(\w+)\((\d+)\)/)?.slice(1) || []
            return signal && previousSignals[signal] !== parseInt(value)
          })

          if (!hasChanges && msg.payload.changes.length === 0) {
            console.log(`Index ${index}: Skipping ${msg.payload.message_type}, no signal changes`)
            return
          }

          if (msg.payload.changes.length > 0) {
            // Use only changed signals for display 
            modifiedFunction = msg.payload.changes.join(" ")
            displayText = `[${msg.protocol}] ${modifiedFunction}${getProtocolBadge(msg.protocol)}`
            shouldAdd = true
          }
        }

        // Updati states of signals lilcomparaison m3a liba3do
        Object.entries(currentSignals).forEach(([signal, value]) => {
          lastSignalState[component][signal] = value as number
        })
      } else if (isGVMMessage) {
        const currentState = msg.payload.function
        if (lastState[component].gvm === currentState) {
          console.log(`Index ${index}: Skipping ${msg.payload.message_type}, same GVM state`)
          return
        }
        lastState[component].gvm = currentState
        shouldAdd = true
      } else if (isPathMessage) {
        const currentValue = msg.payload.function
        if (lastState[component].path === currentValue) {
          console.log(`Index ${index}: Skipping ${msg.payload.message_type}, same path`)
          return
        }
        lastState[component].path = currentValue
        shouldAdd = true
      } else if (isFailureMessage) {
        const currentFailure = msg.payload.function
        if (lastState[component].failure === currentFailure) {
          console.log(`Index ${index}: Skipping ${msg.payload.message_type}, same failure`)
          return
        }
        lastState[component].failure = currentFailure
        shouldAdd = true
      } else {
        shouldAdd = true
      }

      if (!shouldAdd) {
        console.log(`Index ${index}: Skipping ${msg.payload.message_type}, shouldAdd=false`)
        return
      }

      const key = `${msg.source_vm}-${msg.destination_vm}-${displayText}`
      console.log(`Index ${index}: Key=${key}, Text=${displayText}, Component=${component}, Time=${msg.timestamp}`)

      const isLastMessage = index === filtered.length - 1

      if (key !== lastKey && currentGroup.length > 0) {
        result.push(currentGroup[0])
        if (currentGroup.length > 1) result.push(currentGroup[currentGroup.length - 1])
        currentGroup = [{ ...msg, payload: { ...msg.payload, function: modifiedFunction } }]
      } else {
        currentGroup.push({ ...msg, payload: { ...msg.payload, function: modifiedFunction } })
      }
      lastKey = key

      if (isLastMessage && currentGroup.length > 0) {
        result.push(currentGroup[0])
        if (currentGroup.length > 1) result.push(currentGroup[currentGroup.length - 1])
      }
    })

    return result.slice(-maxMessages)
  }, [messages, timeRange, selectedProtocol, maxMessages])

  const generateMermaidDiagram = useMemo(() => {
    const messagesToShow = isPlaying ? filteredMessages.slice(0, currentIndex + 1) : filteredMessages
    console.log(`Rendering ${messagesToShow.length} messages in the diagram`)

    if (messagesToShow.length === 0) {
      return `sequenceDiagram
    box CDC Domain  
    participant VM1 as MCU
    participant VM2 as QNX
    participant VM3 as FVM
    participant VM4 as RBVM
    end
    Note over VM1,VM4: No messages to display`
    }

    let diagram = `sequenceDiagram
    box CDC Domain
    participant VM1 as MCU
    participant VM2 as QNX
    participant VM3 as FVM
    participant VM4 as RBVM
    end
    activate VM1
    activate VM2
    activate VM3
    activate VM4
`

    // Helper to extract exact time from timestamp (e.g., "2025-01-01T00:00:08.100000Z" -> "00:00:08") 
    const formatTimestamp = (timestamp: string) => {
      const match = timestamp.match(/T(\d{2}:\d{2}:\d{2})/)
      return match ? match[1] : timestamp
    }

    if (groupByFunction) {
      const groupedMessages = filteredMessages.reduce((acc, msg) => {
        const key = `${msg.source_vm}-${msg.destination_vm}-${msg.payload.function || msg.type}`
        if (!acc[key]) acc[key] = []
        acc[key].push(msg)
        return acc
      }, {} as Record<string, UnifiedMessage[]>)

      let lastModeState: string | null = null
      let lastSleepEState: string | null = null

      // Process in reverse to number first message as 1 "bil fala9i last message = 1 but needs to be adding button to show in reverse for now keep it like this and reverse reverse "
      Object.entries(groupedMessages).reverse().forEach(([key, msgs]) => {
        const firstMsg = msgs[0]
        const count = msgs.length
        const isSignalChange = Array.isArray(firstMsg.payload.changes) && firstMsg.payload.signals !== undefined && firstMsg.payload.signals !== null
        const displayName = firstMsg.protocol === "MODE" && (firstMsg.payload.message_type === "QUICK_BOOT" || firstMsg.payload.message_type === "COLD_BOOT")
          ? (firstMsg.payload.message_type === "QUICK_BOOT" ? "Sleep" : "Shutdown")
          : firstMsg.payload.function || firstMsg.type
        const protocol = firstMsg.protocol
        const protocolBadge = getProtocolBadge(firstMsg.protocol)

        if (protocol === "MODE" && (firstMsg.payload.message_type === "QUICK_BOOT" || firstMsg.payload.message_type === "COLD_BOOT")) {
          const currentModeState = firstMsg.payload.message_type === "QUICK_BOOT" ? "Sleep" : "Shutdown"
          if (lastModeState === null || currentModeState !== lastModeState) {
            diagram += `    Note over VM1,VM4: [${protocol}] ${displayName}${protocolBadge}${count > 1 ? ` (${count}x)` : ""}\n`
            lastModeState = currentModeState
          }
        } else if (isSignalChange && firstMsg.payload.changes.some((change: string) => change.match(/^SLEEP_E\(\d+\)$/))) {
          const sleepEChange = firstMsg.payload.changes.find((change: string) => change.match(/^SLEEP_E\(\d+\)$/))
          // modes 
          if (sleepEChange) {
            const sleepEValue = sleepEChange.match(/SLEEP_E\((\d+)\)/)?.[1]
            const currentSleepEState = sleepEValue === "0" ? "Shutdown" : sleepEValue === "1" ? "Sleep" : null
            if (currentSleepEState && (lastSleepEState === null || currentSleepEState !== lastSleepEState)) {
              diagram += `    Note over VM1,VM4: [${protocol}] ${currentSleepEState}${protocolBadge}${count > 1 ? ` (${count}x)` : ""}\n`
              lastSleepEState = currentSleepEState
            }
          }
          // affichage log ka arrow with changed signals
          diagram += `    ${firstMsg.source_vm}->>${firstMsg.destination_vm}: [${protocol}] ${firstMsg.payload.changes.join(" ")}${protocolBadge}${count > 1 ? ` (${count}x)` : ""}\n`
        } else {
          // affichage les message lo5rin
          diagram += `    ${firstMsg.source_vm}->>${firstMsg.destination_vm}: [${protocol}] ${displayName}${protocolBadge}${count > 1 ? ` (${count}x)` : ""}\n`
        }

        if (showTimestamps) {
          msgs.forEach((msg) => {
            diagram += `    Note left of ${msg.source_vm}: ${formatTimestamp(msg.timestamp)}\n`
          })
        }
      })
    } else {
      let lastModeState: string | null = null
      let lastSleepEState: string | null = null


      messagesToShow.forEach((msg, index) => {
        const reverseIndex = messagesToShow.length - index // This makes last message = 1
        const isSignalChange = Array.isArray(msg.payload.changes) && msg.payload.signals !== undefined && msg.payload.signals !== null
        const displayName = msg.protocol === "MODE" && (msg.payload.message_type === "QUICK_BOOT" || msg.payload.message_type === "COLD_BOOT")
          ? (msg.payload.message_type === "QUICK_BOOT" ? "Sleep" : "Shutdown")
          : msg.payload.function || msg.type
        const protocol = msg.protocol
        const protocolBadge = getProtocolBadge(msg.protocol)

        if (protocol === "MODE" && (msg.payload.message_type === "QUICK_BOOT" || msg.payload.message_type === "COLD_BOOT")) {
          const currentModeState = msg.payload.message_type === "QUICK_BOOT" ? "Sleep" : "Shutdown"
          if (lastModeState === null || currentModeState !== lastModeState) {
            // Display QUICK_BOOT and COLD_BOOT as notes from VM1 to VM4
            diagram += `    Note over VM1,VM4: [${protocol}] ${displayName}${protocolBadge} #${reverseIndex}\n`
            lastModeState = currentModeState
          }
        } else if (isSignalChange && msg.payload.changes.some((change: string) => change.match(/^SLEEP_E\(\d+\)$/))) {
          const sleepEChange = msg.payload.changes.find((change: string) => change.match(/^SLEEP_E\(\d+\)$/))
          if (sleepEChange) {
            const sleepEValue = sleepEChange.match(/SLEEP_E\((\d+)\)/)?.[1]
            const currentSleepEState = sleepEValue === "0" ? "Shutdown" : sleepEValue === "1" ? "Sleep" : null
            if (currentSleepEState && (lastSleepEState === null || currentSleepEState !== lastSleepEState)) {
              diagram += `    Note over VM1,VM4: [${protocol}] ${currentSleepEState}${protocolBadge} #${reverseIndex}\n`
              lastSleepEState = currentSleepEState
            }
          }
          // Display signal change as arrow with changed signals
          diagram += `    ${msg.source_vm}->>${msg.destination_vm}: [${protocol}] ${msg.payload.changes.join(" ")}${protocolBadge} #${reverseIndex}\n`
        } else {
          // Display other messages as arrows
          const arrowType = getArrowType(msg.type)
          diagram += `    ${msg.source_vm}${arrowType}${msg.destination_vm}: [${protocol}] ${displayName}${protocolBadge} #${reverseIndex}\n`
        }

        if (showTimestamps) {
          diagram += `    Note left of ${msg.source_vm}: ${formatTimestamp(msg.timestamp)}\n`
        }
      })
    }

    diagram += `
    Note over VM1,VM4: End of Sequence Diagram
    deactivate VM1
    deactivate VM2
    deactivate VM3
    deactivate VM4
`

    return diagram
  }, [filteredMessages, currentIndex, isPlaying, showTimestamps, groupByFunction])

  useEffect(() => {
    if (!mermaid || !diagramRef.current) return

    const renderDiagram = async () => {
      try {
        const newDiagramId = `sequence-diagram-${Date.now()}`
        setDiagramId(newDiagramId)
        diagramRef.current!.innerHTML = ""
        const { svg } = await mermaid.render(newDiagramId, generateMermaidDiagram)
        if (diagramRef.current) diagramRef.current.innerHTML = svg
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error)
        if (diagramRef.current) diagramRef.current.innerHTML = `<div className="text-red-500 p-4">Error rendering diagram: ${error}</div>`
      }
    }

    renderDiagram()
  }, [generateMermaidDiagram, isDarkMode])

  useEffect(() => {
    if (!isPlaying || filteredMessages.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= filteredMessages.length - 1 ? (setIsPlaying(false), prev) : prev + 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, filteredMessages.length])

  const handlePlay = () => {
    if (currentIndex >= filteredMessages.length - 1) setCurrentIndex(0)
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentIndex(0)
  }

  const svgToCanvas = (svgElement: SVGElement): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("Could not get canvas context")); return }

      const svgRect = svgElement.getBoundingClientRect()
      const svgData = new XMLSerializer().serializeToString(svgElement)

      const scale = 2
      canvas.width = svgRect.width * scale
      canvas.height = svgRect.height * scale
      ctx.scale(scale, scale)

      ctx.fillStyle = isDarkMode ? "#1f2937" : '#f9fafb'
      ctx.fillRect(0, 0, svgRect.width, svgRect.height)

      const img = new Image()
      img.onload = () => { ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height); resolve(canvas) }
      img.onerror = reject

      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(svgBlob)
      img.src = url
    })
  }

  const canvasToPDF = async (canvas: HTMLCanvasElement, filename: string) => {
    const { jsPDF } = await import("jspdf")
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    })

    pdf.setFontSize(16)
    pdf.text("SDV Communication Sequence Diagram", 20, 30)
    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 50)
    pdf.text(`Messages: ${filteredMessages.length} | Protocol: ${selectedProtocol}`, 20, 65)

    const imgData = canvas.toDataURL("image/png", 1.0)
    pdf.addImage(imgData, "PNG", 20, 80, canvas.width * 0.8, canvas.height * 0.8)
    pdf.save(filename)
  }

  const downloadSVG = () => {
    if (!diagramRef.current) return
    const svgElement = diagramRef.current.querySelector("svg")
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const svgUrl = URL.createObjectURL(svgBlob)

    const downloadLink = document.createElement("a")
    downloadLink.href = svgUrl
    downloadLink.download = `sequence-diagram-${new Date().toISOString().slice(0, 10)}.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(svgUrl)
  }

  const downloadPDF = async () => {
    if (!diagramRef.current) return
    const svgElement = diagramRef.current.querySelector("svg")
    if (!svgElement) return

    setIsExporting(true)
    try {
      const canvas = await svgToCanvas(svgElement as SVGElement)
      const filename = `sequence-diagram-${new Date().toISOString().slice(0, 10)}.pdf`
      await canvasToPDF(canvas, filename)
    } catch (error) {
      console.error("Error exporting PDF:", error)
      alert("Failed to export PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const downloadPNG = async () => {
    if (!diagramRef.current) return
    const svgElement = diagramRef.current.querySelector("svg")
    if (!svgElement) return

    setIsExporting(true)
    try {
      const canvas = await svgToCanvas(svgElement as SVGElement)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const downloadLink = document.createElement("a")
        downloadLink.href = url
        downloadLink.download = `sequence-diagram-${new Date().toISOString().slice(0, 10)}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(url)
      }, "image/png", 1.0)
    } catch (error) {
      console.error("Error exporting PNG:", error)
      alert("Failed to export PNG. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const protocols = [...new Set(messages.map((msg) => msg.protocol))]

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">📊 SDV Communication Sequence Diagram</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={handlePlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  {isExporting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" /> : <Download className="h-4 w-4" />}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadSVG}><FileImage className="h-4 w-4 mr-2" />Export as SVG</DropdownMenuItem>
                <DropdownMenuItem onClick={downloadPNG}><FileImage className="h-4 w-4 mr-2" />Export as PNG</DropdownMenuItem>
                <DropdownMenuItem onClick={downloadPDF}><FileText className="h-4 w-4 mr-2" />Export as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="space-y-2">
            <Label>Protocol Filter</Label>
            <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Protocols</SelectItem>
                {protocols.map((protocol) => <SelectItem key={protocol} value={protocol}>{protocol}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Time Range</Label>
            <div className="flex items-center space-x-2">
              <Switch checked={timeRange === "off"} onCheckedChange={handleTimeRangeToggle} />
              <Label>Off</Label>
            </div>
            {timeRange !== "off" && (
              <div className="flex gap-2">
                <Input type="number" value={hours} onChange={(e) => { setHours(e.target.value); updateTimeRange(e.target.value, minutes, seconds) }} placeholder="Hours" min="0" className={timeError ? "border-red-500" : ""} />
                <Input type="number" value={minutes} onChange={(e) => { setMinutes(e.target.value); updateTimeRange(hours, e.target.value, seconds) }} placeholder="Minutes" min="0" max="59" className={timeError ? "border-red-500" : ""} />
                <Input type="number" value={seconds} onChange={(e) => { setSeconds(e.target.value); updateTimeRange(hours, minutes, e.target.value) }} placeholder="Seconds" min="0" max="59" className={timeError ? "border-red-500" : ""} />
              </div>
            )}
            {timeError && <p className="text-red-500 text-sm mt-1">{timeError}</p>}
            {timeRange !== "off" && typeof timeRange === "number" && <div className="text-xs text-gray-500">{(timeRange / 1000).toFixed(2)}s</div>}
          </div>
          <div className="space-y-2">
            <Label>Max Messages</Label>
            <Slider value={[maxMessages]} onValueChange={(value) => setMaxMessages(value[0])} max={99999999} min={5} step={5} className="w-full" />
            <div className="text-xs text-gray-500">{maxMessages} messages</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch checked={showTimestamps} onCheckedChange={setShowTimestamps} />
              <Label>Show Timestamps</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={groupByFunction} onCheckedChange={setGroupByFunction} />
              <Label>Group by Function</Label>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
          {Object.values(VM_INFO).map((vm) => (
            <div key={vm.id} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-900 rounded border">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: vm.color }} />
              <div><div className="font-medium text-sm">{vm.name}</div><div className="text-xs text-gray-500">{vm.description}</div></div>
            </div>
          ))}
        </div>
        {isExporting && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <span className="text-sm font-medium">Exporting diagram...</span>
            </div>
          </div>
        )}
        {isPlaying && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Animation Progress</span><span>{currentIndex + 1} / {filteredMessages.length}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / filteredMessages.length) * 100}%` }} />
            </div>
          </div>
        )}
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 overflow-x-auto overflow-y-visible" style={{ maxHeight: 'none' }}>
          <div ref={diagramRef} className="min-h-[2000px] flex items-center justify-center">
            <div className="text-gray-500">Loading diagram...</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <div className="font-medium text-blue-700 dark:text-blue-300">Total Messages Before Filtering repeated data</div>
            <div className="text-2xl font-bold text-blue-600">{filteredMessages.length}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <div className="font-medium text-green-700 dark:text-green-300">Active VMs</div>
            <div className="text-2xl font-bold text-green-600">{new Set([...filteredMessages.map((m) => m.source_vm), ...filteredMessages.map((m) => m.destination_vm)]).size}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <div className="font-medium text-purple-700 dark:text-purple-300">Protocols Used</div>
            <div className="text-2xl font-bold text-purple-600">{new Set(filteredMessages.map((m) => m.protocol)).size}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
