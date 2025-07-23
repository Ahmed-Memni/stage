export interface UnifiedMessage {
  timestamp: string
  source_vm: string
  destination_vm: string
  protocol: "UART" | "SOMEIP" | "MODE" | "CAN" // "MODE" for cases where protocol is not relevant LIKE QUICK boot and cold boot and also if u want to take off can u need to take it off in the generation also cuz some of them has can 
  type:
  | "DIAG_REQ"
  | "DIAG_RESP"
  | "CAN_FRAME"
  | "STATUS_UPDATE"
  | "ERROR_CODE"
  | "HEARTBEAT"
  | "CONFIG_SET"
  | "DATA_STREAM"
  | "ACK"
  | "NACK"
  | "COMMUNICATION_FAILURE"
  raw: string
  payload: Record<string, any>
}

export interface MessageFilter {
  protocol: string
  messageType: string
  sourceVM: string
  destinationVM: string
  timeRange: string
}

export interface VMConnection {
  source: string
  destination: string
  count: number
  protocols: string[]
}

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface Alert {
  id: string
  ruleId: string
  title: string
  message: string
  severity: AlertSeverity
  timestamp: string
  acknowledged: boolean
  data: Record<string, any>
}

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  severity: AlertSeverity
  type: "error_rate" | "missing_heartbeat" | "communication_failure" | "protocol_anomaly" | "message_flood"
  threshold: number
  timeWindow: number // in seconds
}
