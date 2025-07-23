"use client"

import { X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorAlertProps {
  error: string | null
  onDismiss: () => void
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) return null

  return (
    <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900 dark:border-red-700">
      <div className="flex items-center justify-between">
        <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        <Button
          onClick={onDismiss}
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}
