import type { UnifiedMessage } from "@/types/ecu-types"
import { unifiedDataGenerator } from "./unified-data-generator"

class ECUCommunicationService {
  private isMonitoring = false
  private monitoringCallback: ((messages: UnifiedMessage[]) => void) | null = null
  private unsubscribe: (() => void) | null = null
  private fileMessages: UnifiedMessage[] | null = null

  startMonitoring(callback: (messages: UnifiedMessage[]) => void): void {
    this.isMonitoring = true
    this.monitoringCallback = callback
    this.fileMessages = null // Reset file messages for generate mode

    unifiedDataGenerator.startContinuousGeneration();
    this.unsubscribe = unifiedDataGenerator.subscribe((messages: UnifiedMessage[]) => {
      if (this.isMonitoring && this.monitoringCallback) {
        this.monitoringCallback(messages)
      }
    })
  }

  loadFileData(file: File, callback: (messages: UnifiedMessage[]) => void): void {
    this.isMonitoring = true
    this.monitoringCallback = callback
    this.fileMessages = null

    unifiedDataGenerator.loadFromFile(file).then((messages) => {
      this.fileMessages = messages
      if (this.isMonitoring && this.monitoringCallback) {
        this.monitoringCallback(messages)
      }
    }).catch((error) => {
      console.error("Error loading file:", error)
      this.isMonitoring = false
      this.monitoringCallback = null
    })
  }

  stopMonitoring(): void {
    this.isMonitoring = false
    this.monitoringCallback = null
    this.fileMessages = null
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }

  async loadHistoricalData(): Promise<UnifiedMessage[]> {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return unifiedDataGenerator.getUnifiedMessages(100)
  }

  private generateMockMessages(count: number): UnifiedMessage[] {
    return unifiedDataGenerator.getUnifiedMessages(count)
  }

  private generateRawData(protocol: string, type: string): string {
    switch (protocol) {
      case "UART":
        return `UART:${type}:${Math.random().toString(16).substr(2, 8).toUpperCase()}`
      case "SOMEIP":
        const serviceId = Math.floor(Math.random() * 0xffff)
          .toString(16)
          .padStart(4, "0")
        const methodId = Math.floor(Math.random() * 0xffff)
          .toString(16)
          .padStart(4, "0")
        return `SOMEIP:${serviceId}:${methodId}:${type}`
      case "CAN":
        const canId = Math.floor(Math.random() * 0x7ff)
          .toString(16)
          .padStart(3, "0")
        const data = Array.from({ length: 8 }, () =>
          Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, "0"),
        ).join(" ")
        return `CAN:${canId}:[${data}]`
      default:
        return `${protocol}:${type}:${Math.random().toString(16).substr(2, 8)}`
    }
  }

  private generatePayload(protocol: string, type: string, functionName?: string): Record<string, any> {
    const basePayload = {
      protocol,
      message_type: type,
      sequence_id: Math.floor(Math.random() * 0xffff),
      timestamp: Date.now(),
      function: functionName,
    }

    switch (type) {
      case "DIAG_REQ":
        return {
          ...basePayload,
          service_id: Math.floor(Math.random() * 0xff),
          sub_function: Math.floor(Math.random() * 0xff),
          data_length: Math.floor(Math.random() * 64),
          function: functionName || "diagnosticRequest",
        }
      case "DIAG_RESP":
        return {
          ...basePayload,
          response_code: Math.random() > 0.8 ? "ERROR" : "SUCCESS",
          data: Array.from({ length: Math.floor(Math.random() * 32) }, () => Math.floor(Math.random() * 256)),
          function: functionName || "diagnosticResponse",
        }
      case "CAN_FRAME":
        return {
          ...basePayload,
          can_id: Math.floor(Math.random() * 0x7ff),
          dlc: Math.floor(Math.random() * 8) + 1,
          data: Array.from({ length: 8 }, () => Math.floor(Math.random() * 256)),
          function: functionName || "canMessage",
        }
      case "STATUS_UPDATE":
        return {
          ...basePayload,
          status: Math.random() > 0.7 ? "ERROR" : "OK",
          cpu_usage: Math.floor(Math.random() * 100),
          memory_usage: Math.floor(Math.random() * 100),
          function: functionName || "statusUpdate",
        }
      case "ERROR_CODE":
        return {
          ...basePayload,
          error_code: Math.floor(Math.random() * 0xffff),
          severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][Math.floor(Math.random() * 4)],
          description: "System error detected",
          function: functionName || "errorReport",
        }
      case "HEARTBEAT":
        return {
          ...basePayload,
          alive_counter: Math.floor(Math.random() * 0xffff),
          system_time: Date.now(),
          function: functionName || "heartbeat",
        }
      default:
        return {
          ...basePayload,
          function: functionName || type.toLowerCase(),
        }
    }
  }
}

export const ecuCommunicationService = new ECUCommunicationService();
