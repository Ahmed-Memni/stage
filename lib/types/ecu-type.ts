export type UnifiedMessage = {
  timestamp: string
  source_vm: string
  destination_vm: string
  protocol: "UART" | "SOMEIP" | "CAN"
  type:
    | "DATA_STREAM"
    | "DIAG_REQ"
    | "DIAG_RESP"
    | "ERROR_CODE"
    | "NACK"
    | "COMMUNICATION_FAILURE"
    | "ACK"
    | "HEARTBEAT"
    | "STATUS_UPDATE"
  raw: string
  payload: Record<string, any>
}
