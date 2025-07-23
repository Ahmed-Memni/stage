import type { UnifiedMessage } from "@/types/ecu-types"

interface SensorReading {
  timestamp: string
  sensor_id: string
  value: number
  received_at?: string
  source: string
}

class UnifiedDataGenerator {
  private messages: UnifiedMessage[] = []
  private sensorReadings: SensorReading[] = []
  private isGenerating = false
  private subscribers: ((messages: UnifiedMessage[]) => void)[] = []

  constructor() {
    // this.initializeHistoricalData()//this s the initial data generation
    // Uncomment the line below to start continuous generation of messages and sensor readings
    // this.startContinuousGeneration()
  }

  async loadFromFile(file: File): Promise<UnifiedMessage[]> {
    try {
      const text = await file.text()
      const parsedData = JSON.parse(text) as UnifiedMessage[]

      if (!Array.isArray(parsedData)) {
        throw new Error("File must contain an array of UnifiedMessage objects")
      }

      const validMessages = parsedData.filter(msg =>
        msg.timestamp &&
        msg.source_vm &&
        msg.destination_vm &&
        msg.protocol &&
        msg.type &&
        msg.raw &&
        msg.payload
      )

      if (validMessages.length === 0) {
        throw new Error("No valid UnifiedMessage objects found in file")
      }

      return validMessages
    } catch (error) {
      console.error("Error parsing file:", error)
      throw error
    }
  }

  subscribe(callback: (messages: UnifiedMessage[]) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  getUnifiedMessages(count: number): UnifiedMessage[] {
    return this.messages.slice(0, count)
  }

  getUartSensorData(): SensorReading[] {
    return this.sensorReadings.filter((reading) => reading.source === "UART")
  }

  getLogSensorData(): SensorReading[] {
    return this.sensorReadings.filter((reading) => reading.source === "Log")
  }

  private initializeHistoricalData(): void {
    this.generateUnifiedMessages(200)
    this.generateSensorReadings()
  }

  public startContinuousGeneration(): void {
    if (this.isGenerating) return
    this.isGenerating = true

    const generateContinuous = () => {
      if (!this.isGenerating) return

      const newMessages = this.generateUnifiedMessages(Math.floor(Math.random() * 7) + 2)
      const newSensorReadings = this.generateNewSensorReadings()

      this.messages.unshift(...newMessages)
      this.sensorReadings.unshift(...newSensorReadings)

      this.messages = this.messages.slice(0, 1000)
      this.sensorReadings = this.sensorReadings.slice(0, 100)

      this.notifySubscribers(newMessages)

      const nextInterval = Math.floor(Math.random() * 2000) + 1000
      setTimeout(generateContinuous, nextInterval)
    }

    generateContinuous()
  }

  private notifySubscribers(newMessages: UnifiedMessage[]): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(newMessages)
      } catch (error) {
        console.error("Error notifying subscriber:", error)
      }
    })
  }

  private generateUnifiedMessages(count: number): UnifiedMessage[] {
    const messages: UnifiedMessage[] = []
    const vms = ["VM1", "VM2", "VM3", "VM4", "VM5", "VM6"] // VM5: FVM, VM6: RBVM
    const protocols: Array<"UART" | "SOMEIP" | "CAN"> = ["UART", "SOMEIP", "CAN"]

    const communicationPatterns = [
      {
        from: "VM1",
        to: "VM3",
        protocol: "SOMEIP" as const,
        functions: ["getVehicleSpeed", "getNavigationData", "requestDiagnostics"],
        weight: 0.25,
      },
      {
        from: "VM3",
        to: "VM1",
        protocol: "SOMEIP" as const,
        functions: ["vehicleStatusUpdate", "diagnosticResponse", "speedUpdate"],
        weight: 0.25,
      },
      {
        from: "VM2",
        to: "VM4",
        protocol: "CAN" as const,
        functions: ["audioRouting", "sensorDataRequest", "systemHealthCheck"],
        weight: 0.15,
      },
      {
        from: "VM4",
        to: "VM2",
        protocol: "CAN" as const,
        functions: ["emergencyAlert", "safetyStatus", "criticalWarning"],
        weight: 0.15,
      },
      {
        from: "VM1",
        to: "VM2",
        protocol: "UART" as const,
        functions: ["displayUpdate", "userInput", "mediaControl"],
        weight: 0.08,
      },
      {
        from: "VM2",
        to: "VM1",
        protocol: "UART" as const,
        functions: ["audioStatus", "systemReady", "inputAck"],
        weight: 0.08,
      },
      {
        from: "VM3",
        to: "VM4",
        protocol: "CAN" as const,
        functions: ["safetyCheck", "dataValidation", "systemSync"],
        weight: 0.02,
      },
      {
        from: "VM4",
        to: "VM3",
        protocol: "CAN" as const,
        functions: ["validationResult", "safetyOk", "criticalData"],
        weight: 0.02,
      },
      {
        from: "VM5",
        to: "VM6",
        protocol: "SOMEIP" as const,
        functions: ["fvmDataRequest", "rbvmStatusUpdate", "fvmDiagnostics"],
        weight: 0.05,
      },
      {
        from: "VM6",
        to: "VM5",
        protocol: "SOMEIP" as const,
        functions: ["rbvmDataResponse", "fvmStatusAck", "diagnosticResponse"],
        weight: 0.05,
      },
      {
        from: "VM5",
        to: "VM1",
        protocol: "UART" as const,
        functions: ["fvmDisplayUpdate", "fvmUserInput", "fvmMediaControl"],
        weight: 0.05,
      },
      {
        from: "VM1",
        to: "VM5",
        protocol: "UART" as const,
        functions: ["fvmAudioStatus", "fvmSystemReady", "fvmInputAck"],
        weight: 0.05,
      },
      {
        from: "VM6",
        to: "VM2",
        protocol: "CAN" as const,
        functions: ["rbvmSafetyCheck", "rbvmDataValidation", "rbvmSystemSync"],
        weight: 0.02,
      },
      {
        from: "VM2",
        to: "VM6",
        protocol: "CAN" as const,
        functions: ["rbvmValidationResult", "rbvmSafetyOk", "rbvmCriticalData"],
        weight: 0.02,
      },
      {
        from: "VM3",
        to: "VM5",
        protocol: "SOMEIP" as const,
        functions: ["mcDataRequest", "mcStatusUpdate", "mcDiagnostics"],
        weight: 0.03,
      },
      {
        from: "VM5",
        to: "VM3",
        protocol: "SOMEIP" as const,
        functions: ["mcDataResponse", "mcStatusAck", "diagnosticResponse"],
        weight: 0.03,
      },
      {
        from: "VM4",
        to: "VM6",
        protocol: "UART" as const,
        functions: ["qnxDisplayUpdate", "qnxUserInput", "qnxMediaControl"],
        weight: 0.03,
      },
      {
        from: "VM6",
        to: "VM4",
        protocol: "UART" as const,
        functions: ["qnxAudioStatus", "qnxSystemReady", "qnxInputAck"],
        weight: 0.03,
      },
      {
        from: "VM1",
        to: "VM2",
        protocol: "CAN" as const,
        functions: ["systemHealthCheck", "sensorDataRequest", "audioRouting"],
        weight: 0.01,
      },
      {
        from: "VM2",
        to: "VM1",
        protocol: "CAN" as const,
        functions: ["criticalWarning", "emergencyAlert", "safetyStatus"],
        weight: 0.01,
      },
      {
        from: "VM3",
        to: "VM4",
        protocol: "UART" as const,
        functions: ["vehicleSpeed", "navigationData", "diagnosticRequest"],
        weight: 0.01,
      },
      {
        from: "VM4",
        to: "VM3",
        protocol: "UART" as const,
        functions: ["vehicleStatusUpdate", "speedUpdate", "diagnosticResponse"],
        weight: 0.01,
      },
      {
        from: "VM5",
        to: "VM6",
        protocol: "CAN" as const,
        functions: ["fvmDataRequest", "rbvmStatusUpdate", "fvmDiagnostics"],
        weight: 0.01,
      },
      {
        from: "VM6",
        to: "VM5",
        protocol: "CAN" as const,
        functions: ["rbvmDataResponse", "fvmStatusAck", "diagnosticResponse"],
        weight: 0.01,
      },
      {
        from: "VM1",
        to: "VM3",
        protocol: "SOMEIP" as const,
        functions: ["mcDataRequest", "mcStatusUpdate", "mcDiagnostics"],
        weight: 0.01,
      },
      {
        from: "VM3",
        to: "VM1",
        protocol: "SOMEIP" as const,
        functions: ["mcDataResponse", "mcStatusAck", "diagnosticResponse"],
        weight: 0.01,
      },
    ]

    for (let i = 0; i < count; i++) {
      const now = Date.now()
      const timestamp = new Date(now - Math.random() * 10000).toISOString()

      let messageType: UnifiedMessage["type"] = "DATA_STREAM"

      if (Math.random() < 0.3) {
        const sourceVM = vms[Math.floor(Math.random() * vms.length)]
        const destinationVM = vms[Math.floor(Math.random() * vms.length)]

        if (sourceVM !== destinationVM) {
          const message: UnifiedMessage = {
            timestamp,
            source_vm: sourceVM,
            destination_vm: destinationVM,
            protocol: "UART",
            type: "HEARTBEAT",
            raw: this.generateRawData("UART", "HEARTBEAT"),
            payload: {
              protocol: "UART",
              message_type: "HEARTBEAT",
              sequence_id: Math.floor(Math.random() * 0xffff),
              timestamp: now,
              function: "heartbeat",
              alive_counter: Math.floor(Math.random() * 0xffff),
              system_time: now,
            },
          }
          messages.push(message)
          continue
        }
      }

      const random = Math.random()
      let cumulativeWeight = 0
      let selectedPattern = communicationPatterns[0]

      for (const pattern of communicationPatterns) {
        cumulativeWeight += pattern.weight
        if (random <= cumulativeWeight) {
          selectedPattern = pattern
          break
        }
      }

      const selectedFunction = selectedPattern.functions[Math.floor(Math.random() * selectedPattern.functions.length)]

      if (selectedFunction.includes("request") || selectedFunction.includes("get")) {
        messageType = "DIAG_REQ"
      } else if (
        selectedFunction.includes("response") ||
        selectedFunction.includes("update") ||
        selectedFunction.includes("status")
      ) {
        messageType = "DIAG_RESP"
      } else if (
        selectedFunction.includes("alert") ||
        selectedFunction.includes("warning") ||
        selectedFunction.includes("emergency")
      ) {
        messageType = "ERROR_CODE"
      } else if (selectedFunction.includes("ack") || selectedFunction.includes("ok")) {
        messageType = "ACK"
      } else {
        messageType = "DATA_STREAM"
      }

      if (Math.random() < 0.05) {
        const errorTypes: Array<UnifiedMessage["type"]> = ["ERROR_CODE", "NACK", "COMMUNICATION_FAILURE"]
        messageType = errorTypes[Math.floor(Math.random() * errorTypes.length)]
      }

      const message: UnifiedMessage = {
        timestamp,
        source_vm: selectedPattern.from,
        destination_vm: selectedPattern.to,
        protocol: selectedPattern.protocol,
        type: messageType,
        raw: this.generateRawData(selectedPattern.protocol, messageType),
        payload: this.generatePayload(selectedPattern.protocol, messageType, selectedFunction),
      }

      messages.push(message)
    }

    return messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  private generateSensorReadings(): void {
    const uartSensorIds = ["PCU_RPM", "PCU_TEMP", "CDC_Display", "CDC_Audio"]
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(Date.now() - i * 30000).toISOString()
      const sensorId = uartSensorIds[Math.floor(Math.random() * uartSensorIds.length)]
      let value: number

      switch (sensorId) {
        case "PCU_RPM":
          value = 2000 + Math.random() * 2000
          break
        case "PCU_TEMP":
          value = 80 + Math.random() * 40
          break
        case "CDC_Display":
          value = 50 + Math.random() * 50
          break
        case "CDC_Audio":
          value = 20 + Math.random() * 80
          break
        default:
          value = Math.random() * 100
      }

      this.sensorReadings.push({
        timestamp,
        sensor_id: sensorId,
        value: Math.round(value * 100) / 100,
        received_at: new Date(Date.now() - i * 30000 + 1000).toISOString(),
        source: "UART",
      })
    }

    const logSensorIds = ["PCU_VOLTAGE", "PCU_CURRENT", "CDC_GPS", "CDC_Network"]
    for (let i = 0; i < 15; i++) {
      const timestamp = new Date(Date.now() - i * 60000).toISOString()
      const sensorId = logSensorIds[Math.floor(Math.random() * logSensorIds.length)]
      let value: number

      switch (sensorId) {
        case "PCU_VOLTAGE":
          value = 12 + Math.random() * 2
          break
        case "PCU_CURRENT":
          value = 10 + Math.random() * 20
          break
        case "CDC_GPS":
          value = Math.random() * 100
          break
        case "CDC_Network":
          value = 70 + Math.random() * 30
          break
        default:
          value = Math.random() * 100
      }

      this.sensorReadings.push({
        timestamp,
        sensor_id: sensorId,
        value: Math.round(value * 100) / 100,
        source: "Log",
      })
    }
  }

  private generateNewSensorReadings(): SensorReading[] {
    const newReadings: SensorReading[] = []
    const now = Date.now()

    const uartCount = Math.floor(Math.random() * 3) + 1
    const uartSensorIds = ["PCU_RPM", "PCU_TEMP", "CDC_Display", "CDC_Audio"]

    for (let i = 0; i < uartCount; i++) {
      const sensorId = uartSensorIds[Math.floor(Math.random() * uartSensorIds.length)]
      let value: number

      switch (sensorId) {
        case "PCU_RPM":
          value = 2000 + Math.random() * 2000
          break
        case "PCU_TEMP":
          value = 80 + Math.random() * 40
          break
        case "CDC_Display":
          value = 50 + Math.random() * 50
          break
        case "CDC_Audio":
          value = 20 + Math.random() * 80
          break
        default:
          value = Math.random() * 100
      }

      newReadings.push({
        timestamp: new Date(now).toISOString(),
        sensor_id: sensorId,
        value: Math.round(value * 100) / 100,
        received_at: new Date(now + 1000).toISOString(),
        source: "UART",
      })
    }

    if (Math.random() < 0.3) {
      const logSensorIds = ["PCU_VOLTAGE", "PCU_CURRENT", "CDC_GPS", "CDC_Network"]
      const sensorId = logSensorIds[Math.floor(Math.random() * logSensorIds.length)]
      let value: number

      switch (sensorId) {
        case "PCU_VOLTAGE":
          value = 12 + Math.random() * 2
          break
        case "PCU_CURRENT":
          value = 10 + Math.random() * 20
          break
        case "CDC_GPS":
          value = Math.random() * 100
          break
        case "CDC_Network":
          value = 70 + Math.random() * 30
          break
        default:
          value = Math.random() * 100
      }

      newReadings.push({
        timestamp: new Date(now).toISOString(),
        sensor_id: sensorId,
        value: Math.round(value * 100) / 100,
        source: "Log",
      })
    }

    return newReadings
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

  stopGeneration(): void {
    this.isGenerating = false
  }
}

export const unifiedDataGenerator = new UnifiedDataGenerator()