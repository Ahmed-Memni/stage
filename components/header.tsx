"use client";

import { Sun, Moon, Play, Pause, Activity, Upload, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UnifiedMessage } from "@/types/ecu-types"
import { useState, useRef } from "react"

interface HeaderProps {
  darkMode: boolean
  toggleDarkMode: () => void
  isMonitoring: boolean
  onToggleMonitoring: (messages?: UnifiedMessage[]) => void
}

interface ParsedLog {
  timestamp: Date
  component: string
  line_number: number
  event: string
  message: string
  signals?: Record<string, number>
  changes?: string[]
  routing?: string
  duration?: string
  priority?: string
  sequence?: number // Added for alive msg seq
}

export function Header({ darkMode, toggleDarkMode, isMonitoring, onToggleMonitoring }: HeaderProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loadSelectedFiles, setLoadSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const loadFileInputRef = useRef<HTMLInputElement>(null)

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>, isLoadDialog: boolean = false) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => file.name.endsWith('.txt'))
      const currentFiles = isLoadDialog ? loadSelectedFiles : selectedFiles
      const duplicates = newFiles.filter(newFile =>
        currentFiles.some(existingFile => existingFile.name === newFile.name)
      )
      const uniqueFiles = newFiles.filter(newFile =>
        !currentFiles.some(existingFile => existingFile.name === newFile.name)
      )

      if (newFiles.length < e.target.files.length) {
        alert("Only text files (.txt) are allowed")
      }
      if (duplicates.length > 0) {
        alert(`Duplicate files detected: ${duplicates.map(file => file.name).join(', ')}. Only unique files were added.`)
      }
      if (uniqueFiles.length > 0) {
        if (isLoadDialog) {
          setLoadSelectedFiles(prev => [...prev, ...uniqueFiles])
        } else {
          setSelectedFiles(prev => [...prev, ...uniqueFiles])
        }
      }
      if (isLoadDialog && loadFileInputRef.current) {
        loadFileInputRef.current.value = ""
      } else if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveFile = (index: number, isLoadDialog: boolean = false) => {
    if (isLoadDialog) {
      setLoadSelectedFiles(prev => prev.filter((_, i) => i !== index))
    } else {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleClearAllFiles = (isLoadDialog: boolean = false) => {
    if (isLoadDialog) {
      setLoadSelectedFiles([])
      if (loadFileInputRef.current) {
        loadFileInputRef.current.value = ""
      }
    } else {
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCreateDataFile = () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one text file")
      return
    }
    console.log("Selected files:", selectedFiles.map(f => f.name))
    selectedFiles.forEach(file => handleFileUpload([file]))
    setSelectedFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ""
    setIsCreateDialogOpen(false)
  }

  const handleLoadFiles = async () => {
    if (loadSelectedFiles.length === 0) {
      alert("Please select at least one text file")
      return
    }
    await handleFileUpload(loadSelectedFiles)
    setLoadSelectedFiles([])
    if (loadFileInputRef.current) loadFileInputRef.current.value = ""
    setIsLoadDialogOpen(false)
  }

  // Parse both OEM and MCU logs
  const parseLogs = (fileContent: string): ParsedLog[] => {
    console.log("parseLogs: Starting to parse file content")

    // OEM log pattern
    const oemPattern = new RegExp(
      `(\\w{3}\\s+\\d{1,2}\\s+\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+oem_pm\\.\\d+\\s+oem_pm\\s+\\d+\\s+oem_pm\\[(.*?):\\s*(\\d+)\\]:\\s*(.+)`,
      'g'
    )

    // Boot log pattern with timestamp
    const bootPatternWithTimestamp = new RegExp(
      `(\\w{3}\\s+\\d{1,2}\\s+\\d{2}:\\d{2}:\\d{2}\\.\\d{3}).*?(quick\\s*boot|cold\\s*boot).*`,
      'gi'
    )

    // Boot log pattern without timestamp
    const bootPatternNoTimestamp = new RegExp(
      `(quick\\s*boot|cold\\s*boot)`,
      'gi'
    )

    // MCU log patterns
    const uartPattern = new RegExp(
      `(\\d{2}-\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+PO\\s+(HI|MD|LO)\\s+pmCpuIf_EventNotifyWakeupLineStat:\\s+([0-9A-Fa-f\\s]+)$`,
      'g'
    )
    const signalPattern = new RegExp(
      `(\\d{2}-\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+PO\\s+(HI|MD|LO)\\s+(?:\\[PM\\]|\\[(\\d+\\s+to\\s+\\d+)\\])\\s+([A-Za-z0-9_()\\s]+?)(?:\\s+(\\d+\\s+ms))?$`,
      'g'
    )
    const hvpmPattern = new RegExp(
      `(\\d{2}-\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+PO\\s+(HI|MD|LO)\\s+HVPM_ProcControlCmd:\\s+(.+?)(?:\\s+(\\d+\\s+ms))?$`,
      'g'
    )
    const responsePattern = new RegExp(
      `(\\d{2}-\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+PO\\s+(HI|MD|LO)\\s+Response of PM EventCmd:\\s+([0-9A-Fa-f\\s]+)$`,
      'g'
    )
    // Some/IP pattern
    const someIpPattern = new RegExp(
      `(\\w{3}\\s+\\d{1,2}\\s+\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+oem_pm\\.\\d+\\s+oem_pm\\s+\\d+\\s+oem_pm\\[CSomeIpProcessor.cpp:\\s*(\\d+)\\]:\\s*(CSomeIpProcessor\\s+(sendSafeModeEvents|ePowerMode|eSleepOrder)\\s*:\\s*.+)`,
      'g'
    )
    // Alive message sequence pattern
    const aliveMsgPattern = new RegExp(
      `(\\d{2}-\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+CO\\s+(HI|MD|LO)\\s+alive msg seq:\\s+(\\d+)$`,
      'g'
    )

    const signalNames = ["SIP_PS_HOLD", "PSAIL_ERR", "SM_ERR1", "SM_ERR2", "POFF", "SLEEP_E", "FB_N", "WK_L", "WK_M", "comm", "boot_R", "boot_S", "off_R"]

    const logs: ParsedLog[] = []
    const unmatchedLines: string[] = []
    const invalidTimestamps: string[] = []
    let lastValidTimestamp: Date | null = null

    const previousSignals: Record<string, number> = {
      SIP_PS_HOLD: 0, PSAIL_ERR: 0, SM_ERR1: 0, SM_ERR2: 0,
      POFF: 0, SLEEP_E: 1, FB_N: 0,
      WK_L: 0, WK_M: 0, comm: 0,
      boot_R: 0, boot_S: 0, off_R: 0
    }

    const lines = fileContent.split('\n')

    lines.forEach((line, index) => {
      if (!line.trim()) return // Skip empty lines

      // Clean line (remove null bytes and invisible characters)
      const cleanedLine = line.replace(/[^\x20-\x7E\t\n]/g, '')
      console.log(`parseLogs: Processing line ${index + 1}: ${cleanedLine.slice(0, 50)}...`)

      // Try Boot pattern with timestamp
      bootPatternWithTimestamp.lastIndex = 0
      const bootMatchWithTimestamp = bootPatternWithTimestamp.exec(cleanedLine)
      if (bootMatchWithTimestamp) {
        const [, timestampStr, bootType] = bootMatchWithTimestamp
        console.log(`parseLogs: Boot match with timestamp at line ${index + 1}: ${bootType}`)

        try {
          // Parse timestamp
          const timestampMatch = timestampStr.match(/(\w{3})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})/)
          if (!timestampMatch) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid timestamp format: ${timestampStr}`)
            return
          }

          const [, month, day, hour, minute, second, millisecond] = timestampMatch
          const monthNames: { [key: string]: number } = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
          }

          const monthIndex = monthNames[month]
          if (monthIndex === undefined) {
            invalidTimestamps.push(`Line ${index + 1}: Unknown month: ${month}`)
            return
          }

          const dayNum = parseInt(day, 10)
          if (dayNum < 1 || dayNum > 31) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid day: ${day}`)
            return
          }

          const hourNum = parseInt(hour, 10)
          if (hourNum > 23) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid hour: ${hour}`)
            return
          }

          const minuteNum = parseInt(minute, 10)
          if (minuteNum > 59) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid minute: ${minute}`)
            return
          }

          const secondNum = parseInt(second, 10)
          if (secondNum > 59) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid second: ${second}`)
            return
          }

          const msNum = parseInt(millisecond, 10)
          if (msNum > 999) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid millisecond: ${millisecond}`)
            return
          }

          const timestamp = new Date(Date.UTC(2025, monthIndex, dayNum, hourNum, minuteNum, secondNum, msNum))
          if (isNaN(timestamp.getTime())) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid timestamp constructed: ${timestampStr}`)
            return
          }

          lastValidTimestamp = timestamp // Update last valid timestamp
          const event = bootType.toLowerCase().includes("quick") ? "QUICK_BOOT" : "COLD_BOOT"
          logs.push({
            timestamp,
            component: "BootManager",
            line_number: index + 1,
            event,
            message: cleanedLine.trim()
          })
          console.log(`parseLogs: Added Boot log with timestamp - Component: BootManager, Event: ${event}, Line: ${index + 1}`)
        } catch (error) {
          console.error(`parseLogs: Error parsing Boot line with timestamp ${index + 1}: ${cleanedLine}`, error)
          invalidTimestamps.push(`Line ${index + 1}: Exception in timestamp parsing: ${timestampStr}`)
        }
        return
      }

      // Try Boot pattern without timestamp
      bootPatternNoTimestamp.lastIndex = 0
      const bootMatchNoTimestamp = bootPatternNoTimestamp.exec(cleanedLine)
      if (bootMatchNoTimestamp) {
        const [, bootType] = bootMatchNoTimestamp
        console.log(`parseLogs: Boot match without timestamp at line ${index + 1}: ${bootType}`)

        try {
          // Use the last valid timestamp or a default if none exists
          const timestamp = lastValidTimestamp || new Date('2025-01-01T00:00:00.000Z')
          const event = bootType.toLowerCase().includes("quick") ? "QUICK_BOOT" : "COLD_BOOT"
          logs.push({
            timestamp,
            component: "BootManager",
            line_number: index + 1,
            event,
            message: cleanedLine.trim()
          })
          console.log(`parseLogs: Added Boot log without timestamp - Component: BootManager, Event: ${event}, Line: ${index + 1}, Timestamp: ${timestamp.toISOString()}`)
        } catch (error) {
          console.error(`parseLogs: Error parsing Boot line without timestamp ${index + 1}: ${cleanedLine}`, error)
          invalidTimestamps.push(`Line ${index + 1}: Exception in timestamp parsing: No timestamp`)
        }
        return
      }

      // Try OEM pattern
      oemPattern.lastIndex = 0
      const oemMatch = oemPattern.exec(cleanedLine)
      if (oemMatch) {
        const [, timestampStr, file, lineNumber, rawMessage] = oemMatch
        console.log(`parseLogs: OEM match at line ${index + 1}: ${rawMessage.slice(0, 50)}...`)

        // Skip lines containing "vmid for guest" for la or la1
        if (rawMessage.includes("vmid for guest") && (rawMessage.includes("name la ") || rawMessage.includes("name la1"))) {
          console.log(`parseLogs: Skipping line ${index + 1}: ${rawMessage.slice(0, 50)}...`)
          return
        }

        let component: string | null = null
        let event = ""

        try {
          // Parse OEM timestamp
          const timestampMatch = timestampStr.match(/(\w{3})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})/)
          if (!timestampMatch) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid timestamp format: ${timestampStr}`)
            return
          }

          const [, month, day, hour, minute, second, millisecond] = timestampMatch
          const monthNames: { [key: string]: number } = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
          }

          const monthIndex = monthNames[month]
          if (monthIndex === undefined) {
            invalidTimestamps.push(`Line ${index + 1}: Unknown month: ${month}`)
            return
          }

          const dayNum = parseInt(day, 10)
          if (dayNum < 1 || dayNum > 31) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid day: ${day}`)
            return
          }

          const hourNum = parseInt(hour, 10)
          if (hourNum > 23) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid hour: ${hour}`)
            return
          }

          const minuteNum = parseInt(minute, 10)
          if (minuteNum > 59) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid minute: ${minute}`)
            return
          }

          const secondNum = parseInt(second, 10)
          if (secondNum > 59) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid second: ${second}`)
            return
          }

          const msNum = parseInt(millisecond, 10)
          if (msNum > 999) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid millisecond: ${millisecond}`)
            return
          }

          const timestamp = new Date(Date.UTC(2025, monthIndex, dayNum, hourNum, minuteNum, secondNum, msNum))
          if (isNaN(timestamp.getTime())) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid timestamp constructed: ${timestampStr}`)
            return
          }

          lastValidTimestamp = timestamp // Update last valid timestamp
          if (file === "MCUMgrTranslator.cpp") {
            component = "MCUMgrTranslator"
            const eventMatch = rawMessage.match(/\[([A-Z_]+)\]/)
            event = eventMatch ? eventMatch[1] : "UNKNOWN"
          } else if (file === "OEMPMMsgTranslator.cpp") {
            component = "OEMPMMsgTranslator"
            const eventMatch = rawMessage.match(/\[([A-Z_]+)\]/)
            event = eventMatch ? eventMatch[1] : "UNKNOWN"
          } else if (file === "CVMMInf.cpp") {
            if (rawMessage.includes("/la1/")) {
              component = "LA1"
              event = "POWER_STATUS_LA1"
            } else if (rawMessage.includes("/la/")) {
              component = "LA"
              event = "POWER_STATUS_LA"
            }
          } else if (file === "CSomeIpProcessor.cpp") {
            component = "CSomeIpProcessor"
            const eventMatch = rawMessage.match(/CSomeIpProcessor\s+(sendSafeModeEvents|ePowerMode|eSleepOrder)/)
            event = eventMatch ? eventMatch[1] : "UNKNOWN"
          }

          if (component) {
            logs.push({
              timestamp,
              component,
              line_number: parseInt(lineNumber, 10),
              event,
              message: rawMessage.trim()
            })
            console.log(`parseLogs: Added OEM log - Component: ${component}, Event: ${event}, Line: ${lineNumber}`)
          } else {
            console.warn(`parseLogs: No valid component at line ${index + 1}: ${file}`)
          }
        } catch (error) {
          console.error(`parseLogs: Error parsing OEM line ${index + 1}: ${rawMessage}`, error)
          invalidTimestamps.push(`Line ${index + 1}: Exception in timestamp parsing: ${timestampStr}`)
        }
        return
      }

      // Try MCU patterns
      uartPattern.lastIndex = 0
      signalPattern.lastIndex = 0
      hvpmPattern.lastIndex = 0
      responsePattern.lastIndex = 0
      aliveMsgPattern.lastIndex = 0
      const uartMatch = uartPattern.exec(cleanedLine)
      const sigMatch = signalPattern.exec(cleanedLine)
      const hvpmMatch = hvpmPattern.exec(cleanedLine)
      const responseMatch = responsePattern.exec(cleanedLine)
      const aliveMsgMatch = aliveMsgPattern.exec(cleanedLine)

      if (aliveMsgMatch) {
        const [, timestampStr, priority, sequence] = aliveMsgMatch
        console.log(`parseLogs: Alive msg seq match at line ${index + 1}: seq ${sequence}`)
        try {
          const tsClean = timestampStr.split('-')[1] || timestampStr
          const timestamp = new Date(`2025-01-01T${tsClean}Z`)
          if (isNaN(timestamp.getTime())) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid MCU timestamp: ${timestampStr}`)
            return
          }

          lastValidTimestamp = timestamp
          logs.push({
            timestamp,
            component: "MCU",
            line_number: index + 1,
            event: "ALIVE_MSG",
            message: `alive msg seq: ${sequence}`,
            routing: "2 to 1",
            priority,
            sequence: parseInt(sequence, 10)
          })
          console.log(`parseLogs: Added Alive msg log - Event: ALIVE_MSG, Sequence: ${sequence}`)
        } catch (error) {
          console.error(`parseLogs: Error parsing Alive msg line ${index + 1}: ${cleanedLine}`, error)
          invalidTimestamps.push(`Line ${index + 1}: Exception in MCU timestamp parsing: ${timestampStr}`)
        }
      } else if (uartMatch) {
        const [, timestampStr, priority, bytesStr] = uartMatch
        console.log(`parseLogs: UART match at line ${index + 1}: ${bytesStr}`)
        try {
          const tsClean = timestampStr.split('-')[1] || timestampStr
          const timestamp = new Date(`2025-01-01T${tsClean}Z`)
          if (isNaN(timestamp.getTime())) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid MCU timestamp: ${timestampStr}`)
            return
          }

          lastValidTimestamp = timestamp
          const lastByte = bytesStr.trim().split(' ').pop()
          const val = lastByte === '01' ? 1 : 0
          const currentSignals: Record<string, number> = { SLEEP_E: val, WK_L: val, comm: val }
          const routing = "1 to 2"
          const duration = "0 ms"
          const message = `pmCpuIf_EventNotifyWakeupLineStat: ${bytesStr}`

          const changes = signalNames
            .filter(name => currentSignals[name] !== undefined && currentSignals[name] !== previousSignals[name])
            .map(name => `${name}(${currentSignals[name]})`)

          signalNames.forEach(name => {
            if (currentSignals[name] != undefined) {
              previousSignals[name] = currentSignals[name]
            }
          })

          logs.push({
            timestamp,
            component: "MCU",
            line_number: index + 1,
            event: changes.length > 0 ? "SIGNAL_CHANGE" : "SIGNAL_STATE",
            message,
            signals: currentSignals,
            changes,
            routing,
            duration,
            priority
          })
          console.log(`parseLogs: Added UART log - Event: ${changes.length > 0 ? "SIGNAL_CHANGE" : "SIGNAL_STATE"}, Signals: ${JSON.stringify(currentSignals)}`)
        } catch (error) {
          console.error(`parseLogs: Error parsing UART line ${index + 1}: ${cleanedLine}`, error)
          invalidTimestamps.push(`Line ${index + 1}: Exception in MCU timestamp parsing: ${timestampStr}`)
        }
      } else if (sigMatch) {
        const [, timestampStr, priority, routing, signalsStr, duration] = sigMatch
        console.log(`parseLogs: Signal match at line ${index + 1}: ${signalsStr}`)
        try {
          const tsClean = timestampStr.split('-')[1] || timestampStr
          const timestamp = new Date(`2025-01-01T${tsClean}Z`)
          if (isNaN(timestamp.getTime())) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid MCU timestamp: ${timestampStr}`)
            return
          }

          lastValidTimestamp = timestamp
          const currentSignals: Record<string, number> = {}
          const signalValuePattern = new RegExp(`(\\w+)\\(([01])\\)`, 'g')
          let signalMatch
          while ((signalMatch = signalValuePattern.exec(signalsStr)) !== null) {
            const [, name, value] = signalMatch
            if (signalNames.includes(name)) {
              currentSignals[name] = parseInt(value, 10)
            }
          }

          const changes = signalNames
            .filter(name => currentSignals[name] !== undefined && currentSignals[name] !== previousSignals[name])
            .map(name => `${name}(${currentSignals[name]})`)

          signalNames.forEach(name => {
            if (currentSignals[name] !== undefined) {
              previousSignals[name] = currentSignals[name]
            }
          })

          logs.push({
            timestamp,
            component: "MCU",
            line_number: index + 1,
            event: changes.length > 0 ? "SIGNAL_CHANGE" : "SIGNAL_STATE",
            message: signalsStr.trim(),
            signals: currentSignals,
            changes,
            routing: routing || "1 to 2",
            duration: duration || "0 ms",
            priority
          })
          console.log(`parseLogs: Added Signal log - Event: ${changes.length > 0 ? "SIGNAL_CHANGE" : "SIGNAL_STATE"}, Signals: ${JSON.stringify(currentSignals)}`)
        } catch (error) {
          console.error(`parseLogs: Error parsing signal line ${index + 1}: ${cleanedLine}`, error)
          invalidTimestamps.push(`Line ${index + 1}: Exception in MCU timestamp parsing: ${timestampStr}`)
        }
      } else if (hvpmMatch) {
        const [, timestampStr, priority, message, duration] = hvpmMatch
        console.log(`parseLogs: HVPM match at line ${index + 1}: ${message}`)
        try {
          const tsClean = timestampStr.split('-')[1] || timestampStr
          const timestamp = new Date(`2025-01-01T${tsClean}Z`)
          if (isNaN(timestamp.getTime())) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid MCU timestamp: ${timestampStr}`)
            return
          }

          lastValidTimestamp = timestamp
          logs.push({
            timestamp,
            component: "MCU",
            line_number: index + 1,
            event: "START_SOC_COMM_REQ",
            message: `HVPM_ProcControlCmd: ${message.trim()}`,
            routing: "2 to 1",
            duration: duration || "0 ms",
            priority
          })
          console.log(`parseLogs: Added HVPM log - Event: START_SOC_COMM_REQ, Message: ${message.trim()}`)
        } catch (error) {
          console.error(`parseLogs: Error parsing HVPM line ${index + 1}: ${cleanedLine}`, error)
          invalidTimestamps.push(`Line ${index + 1}: Exception in MCU timestamp parsing: ${timestampStr}`)
        }
      } else if (responseMatch) {
        const [, timestampStr, priority, bytesStr] = responseMatch
        console.log(`parseLogs: Response match at line ${index + 1}: ${bytesStr}`)
        try {
          const tsClean = timestampStr.split('-')[1] || timestampStr
          const timestamp = new Date(`2025-01-01T${tsClean}Z`)
          if (isNaN(timestamp.getTime())) {
            invalidTimestamps.push(`Line ${index + 1}: Invalid MCU timestamp: ${timestampStr}`)
            return
          }

          lastValidTimestamp = timestamp
          logs.push({
            timestamp,
            component: "MCU",
            line_number: index + 1,
            event: "PM_EVENT_RESP",
            message: `Response of PM EventCmd: ${bytesStr.trim()}`,
            routing: "2 to 1",
            priority
          })
          console.log(`parseLogs: Added Response log - Event: PM_EVENT_RESP, Message: ${bytesStr.trim()}`)
        } catch (error) {
          console.error(`parseLogs: Error parsing Response line ${index + 1}: ${cleanedLine}`, error)
          invalidTimestamps.push(`Line ${index + 1}: Exception in MCU timestamp parsing: ${timestampStr}`)
        }
      } else {
        unmatchedLines.push(`Line ${index + 1}: ${cleanedLine.trim().slice(0, 50)}...`)
      }
    })

    if (unmatchedLines.length > 0) {
      console.warn(`parseLogs: ${unmatchedLines.length} lines did not match any regex:`, unmatchedLines.slice(0, 5))
    }
    if (invalidTimestamps.length > 0) {
      console.warn(`parseLogs: ${invalidTimestamps.length} invalid timestamps:`, invalidTimestamps.slice(0, 5))
    }
    console.log(`parseLogs: Processed ${lines.length} lines, produced ${logs.length} valid logs`)
    return logs
  }

  const convertToUnifiedFormat = (logs: ParsedLog[]): UnifiedMessage[] => {
    console.log(`convertToUnifiedFormat: Converting ${logs.length} logs to UnifiedMessage format`)
    const structuredLogs: UnifiedMessage[] = []

    logs.forEach((log, i) => {
      const timestamp = log.timestamp
      const unixMs = Math.floor(timestamp.getTime())
      const component = log.component

      let source_vm: string
      let destination_vm: string
      let type: UnifiedMessage['type']
      let protocol: "UART" | "SOMEIP" | "MODE" | "CAN" = "UART"

      if (component === "MCU") {
        if (log.event === "START_SOC_COMM_REQ") {
          source_vm = "VM2"
          destination_vm = "VM1"
          type = "DIAG_REQ"
        } else if (log.event === "PM_EVENT_RESP") {
          source_vm = "VM2"
          destination_vm = "VM1"
          type = "DIAG_RESP"
        } else if (log.event === "ALIVE_MSG") {
          source_vm = "VM2"
          destination_vm = "VM1"
          type = "HEARTBEAT"
        } else {
          source_vm = "VM1"
          destination_vm = log.signals && (Object.keys(log.signals).includes("SIP_PS_HOLD") || Object.keys(log.signals).includes("FB_N"))
            ? "VM3"
            : log.routing === "1 to 2" ? "VM2" : "VM2"
          type = log.event === "SIGNAL_CHANGE" || log.event === "SIGNAL_STATE" ? "STATUS_UPDATE" : "DIAG_REQ"
        }
      } else if (component === "MCUMgrTranslator") {
        source_vm = "VM1"
        destination_vm = "VM2"
        type = log.event.includes("_REQ") || log.event === "DEASSERTED_WAKEUP_DS_REQ" || log.event === "START_SOC_COMM_REQ"
          ? "DIAG_REQ"
          : log.event.includes("_RESP") || log.event.includes("OEMPM_EVT_START_SOC_COMM_RESP") ||
            log.event.includes("ASSERTION_WAKEUPLINE_RESP") || log.event.includes("DEASSERTION_WAKEUPLINE_RESP") ||
            log.event.includes("DEASSERTED_WAKEUP_DS_RESP")
            ? "DIAG_RESP"
            : log.event.includes("OEMPM_EVT_ASSERTION_WAKEUP_LINE") || log.event.includes("OEMPM_EVT_DEASSERTION_WAKEUP_LINE")
              ? "HEARTBEAT"
              : "STATUS_UPDATE"
      } else if (component === "OEMPMMsgTranslator") {
        source_vm = "VM2"
        destination_vm = "VM1"
        type = log.event.includes("_REQ") || log.event === "DEASSERTED_WAKEUP_DS_REQ" || log.event === "START_SOC_COMM_REQ"
          ? "DIAG_REQ"
          : log.event.includes("_RESP") || log.event.includes("OEMPM_EVT_START_SOC_COMM_RESP") ||
            log.event.includes("ASSERTION_WAKEUPLINE_RESP") || log.event.includes("DEASSERTION_WAKEUPLINE_RESP") ||
            log.event.includes("DEASSERTED_WAKEUP_DS_RESP")
            ? "DIAG_RESP"
            : log.event.includes("OEMPM_EVT_ASSERTION_WAKEUP_LINE") || log.event.includes("OEMPM_EVT_DEASSERTION_WAKEUP_LINE")
              ? "HEARTBEAT"
              : "STATUS_UPDATE"
      } else if (component === "CSomeIpProcessor") {
        source_vm = "VM2"
        destination_vm = "VM1"
        protocol = "SOMEIP"
        type = log.event === "eSleepOrder" ? "DIAG_REQ" : "STATUS_UPDATE"
      } else if (component === "LA") {
        source_vm = "VM2"
        destination_vm = "VM3"
        type = "STATUS_UPDATE"
      } else if (component === "LA1") {
        source_vm = "VM2"
        destination_vm = "VM4"
        type = "STATUS_UPDATE"
      } else if (component === "BootManager") {
        source_vm = "VM1"
        destination_vm = "VM4"
        type = "STATUS_UPDATE"
        protocol = "MODE"
      } else {
        source_vm = "VM1"
        destination_vm = "VM4"
        type = "STATUS_UPDATE"
      }

      if (type === "STATUS_UPDATE" && component !== "MCU" && component !== "BootManager" && log.event !== "POWER_STATUS_LA" && log.event !== "POWER_STATUS_LA1" && component !== "CSomeIpProcessor") {
        console.warn(`convertToUnifiedFormat: Unknown event type '${log.event}' mapped to STATUS_UPDATE`)
      }

      const structuredLog: UnifiedMessage = {
        timestamp: timestamp.toISOString().replace('Z', '') + '000Z',
        source_vm,
        destination_vm,
        protocol,
        type,
        raw: `${protocol}:${log.event}:${log.message.slice(0, 30)}`,
        payload: {
          protocol,
          message_type: log.event,
          sequence_id: 10000 + i,
          timestamp: unixMs,
          function: log.message,
          component,
          line_number: log.line_number,
          ...(component === "MCU" && {
            signals: log.signals,
            changes: log.changes,
            routing: log.routing,
            duration: log.duration,
            priority: log.priority,
            signal_count: log.signals ? Object.keys(log.signals).length : 0,
            sequence: log.sequence // Added for alive msg seq
          })
        }
      }

      structuredLogs.push(structuredLog)
      console.log(`convertToUnifiedFormat: Added UnifiedMessage - Component: ${component}, Event: ${log.event}, Type: ${type}, Protocol: ${protocol}`)
    })

    console.log(`convertToUnifiedFormat: Produced ${structuredLogs.length} UnifiedMessages`)
    return structuredLogs
  }

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    console.log(`handleFileUpload: Selected files: ${files.map(f => f.name).join(', ')}`)

    const validFiles = files.filter(file => file.name.endsWith('.txt'))
    if (validFiles.length !== files.length) {
      console.error("handleFileUpload: Some files are not .txt")
      alert("Please upload only .txt files")
      return
    }

    try {
      // Read and combine contents of all files
      const fileContents = await Promise.all(
        validFiles.map(file =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              const content = e.target?.result as string
              if (!content) {
                reject(new Error(`Empty content in file: ${file.name}`))
              } else {
                resolve(content)
              }
            }
            reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`))
            reader.readAsText(file)
          })
        )
      )

      // Combine all file contents with newline separator
      const combinedContent = fileContents.join('\n')
      console.log(`handleFileUpload: Combined content length: ${combinedContent.length} characters`)

      const parsedLogs = parseLogs(combinedContent)
      if (parsedLogs.length === 0) {
        console.error("handleFileUpload: No valid logs parsed")
        throw new Error("No valid log entries found in files")
      }

      const unifiedMessages = convertToUnifiedFormat(parsedLogs)
      if (unifiedMessages.length === 0) {
        console.error("handleFileUpload: No UnifiedMessages produced")
        throw new Error("Failed converted logs to UnifiedMessage format")
      }

      console.log("handleFileUpload: Loaded messages:", unifiedMessages.map(msg => ({
        component: msg.payload.component,
        event: msg.payload.message_type,
        protocol: msg.protocol,
        type: msg.type
      })))
      onToggleMonitoring(unifiedMessages)
    } catch (error) {
      console.error("handleFileUpload: Error processing files:", error)
      alert(`Failed to process files: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-300">ECU Communication Analyzer</h1>
            </div>
            <Badge variant={isMonitoring ? "default" : "secondary"} className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {isMonitoring ? "Monitoring" : "Stopped"}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {isMonitoring ? (
              <Button
                onClick={() => {
                  console.log("Stop Monitoring clicked")
                  onToggleMonitoring()
                }}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Stop Monitoring
              </Button>
            ) : (
              <>
                <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Monitoring
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Choose Data Source</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Button
                        onClick={() => {
                          console.log("Generate Data clicked")
                          setIsLoadDialogOpen(false)
                          onToggleMonitoring()
                        }}
                        className="flex items-center gap-2"
                      >
                        Generate Data
                      </Button>
                      <div>
                        <Label htmlFor="load-file-upload">Add Log Files</Label>
                        <label htmlFor="load-file-upload" className="cursor-pointer">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 w-full"
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4" />
                              Choose Log Files
                            </span>
                          </Button>
                          <input
                            id="load-file-upload"
                            type="file"
                            accept=".txt"
                            multiple
                            className="hidden"
                            ref={loadFileInputRef}
                            onChange={(e) => handleAddFiles(e, true)}
                          />
                        </label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>{loadSelectedFiles.length > 0 ? `Selected Files (${loadSelectedFiles.length})` : "No Files Chosen"}</Label>
                          {loadSelectedFiles.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleClearAllFiles(true)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Clear All
                            </Button>
                          )}
                        </div>
                        {loadSelectedFiles.length > 0 && (
                          <ul className="max-h-40 overflow-auto border rounded-md p-2 space-y-1">
                            {loadSelectedFiles.map((file, index) => (
                              <li
                                key={index}
                                className="flex items-center justify-between text-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                <span className="truncate max-w-xs">{file.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleRemoveFile(index, true)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <Button onClick={handleLoadFiles} disabled={loadSelectedFiles.length === 0}>
                        Choose Files
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Data File</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create-file-upload">Add Log Files</Label>
                    <Input
                      id="create-file-upload"
                      type="file"
                      accept=".txt"
                      multiple
                      ref={fileInputRef}
                      onChange={(e) => handleAddFiles(e)}
                    />
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Selected Files ({selectedFiles.length})</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleClearAllFiles()}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Clear All
                        </Button>
                      </div>
                      <ul className="max-h-40 overflow-auto border rounded-md p-2 space-y-1">
                        {selectedFiles.map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between text-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <span className="truncate max-w-xs">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button onClick={handleCreateDataFile} disabled={selectedFiles.length === 0}>
                    Submit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={toggleDarkMode}
              variant="ghost"
              size="icon"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}