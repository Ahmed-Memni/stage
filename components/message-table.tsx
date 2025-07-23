"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, Download, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { UnifiedMessage } from "@/types/ecu-types"

interface MessageTableProps {
  messages: UnifiedMessage[]
}

export function MessageTable({ messages }: MessageTableProps) {
  const [sortField, setSortField] = useState("timestamp")
  const [sortDirection, setSortDirection] = useState("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMessage, setSelectedMessage] = useState<UnifiedMessage | null>(null)
  const itemsPerPage = 20

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      let aVal = a[sortField as keyof UnifiedMessage]
      let bVal = b[sortField as keyof UnifiedMessage]

      if (sortField === "timestamp") {
        aVal = new Date(aVal as string)
        bVal = new Date(bVal as string)
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [messages, sortField, sortDirection])

  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedMessages.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedMessages, currentPage])

  const totalPages = Math.ceil(sortedMessages.length / itemsPerPage)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  const downloadCSV = () => {
    const headers = ["Timestamp", "Protocol", "Type", "Source VM", "Destination VM", "Raw Data"]
    const csvContent = [
      headers.join(","),
      ...messages.map((msg) =>
        [msg.timestamp, msg.protocol, msg.type, msg.source_vm, msg.destination_vm, `"${msg.raw}"`].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ecu_communications.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case "UART":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "SOMEIP":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"

      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Message History</CardTitle>
          <Button onClick={downloadCSV} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No messages available</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("timestamp")}
                  >
                    <div className="flex items-center">
                      Timestamp <SortIcon field="timestamp" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("protocol")}
                  >
                    <div className="flex items-center">
                      Protocol <SortIcon field="protocol" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center">
                      Type <SortIcon field="type" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("source_vm")}
                  >
                    <div className="flex items-center">
                      Communication <SortIcon field="source_vm" />
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMessages.map((message, index) => (
                  <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell className="font-mono text-xs">{new Date(message.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getProtocolColor(message.protocol)}>{message.protocol}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{message.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium text-blue-600 dark:text-blue-400">{message.source_vm}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{message.destination_vm}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(message)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Message Details</DialogTitle>
                          </DialogHeader>
                          {selectedMessage && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Timestamp</label>
                                  <p className="font-mono text-sm">{selectedMessage.timestamp}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Protocol</label>
                                  <p>
                                    <Badge className={getProtocolColor(selectedMessage.protocol)}>
                                      {selectedMessage.protocol}
                                    </Badge>
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Type</label>
                                  <p>
                                    <Badge variant="outline">{selectedMessage.type}</Badge>
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Communication</label>
                                  <p className="text-sm">
                                    {selectedMessage.source_vm} → {selectedMessage.destination_vm}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Raw Data</label>
                                <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto">
                                  {selectedMessage.raw}
                                </pre>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Decoded Payload</label>
                                <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto">
                                  {JSON.stringify(selectedMessage.payload, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, sortedMessages.length)} of {sortedMessages.length} results
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
