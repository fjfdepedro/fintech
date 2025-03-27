"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface RefreshButtonProps {
  onRefresh: () => void
  loading?: boolean
}

export function RefreshButton({ onRefresh, loading }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onRefresh}
      disabled={loading}
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
    </Button>
  )
}