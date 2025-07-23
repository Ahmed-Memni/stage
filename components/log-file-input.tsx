"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LogFileInputProps {
  onLoadLogFile: (filename: string) => void
  loading: boolean
}

export function LogFileInput({ onLoadLogFile, loading }: LogFileInputProps) {
  const [filename, setFilename] = useState("logs.csv")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (filename.trim()) {
      onLoadLogFile(filename.trim())
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Load Log File</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1">
            <Input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter log file name (e.g., logs.csv)"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || !filename.trim()} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Loading..." : "Load"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
