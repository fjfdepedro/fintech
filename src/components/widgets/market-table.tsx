"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { format } from 'date-fns'

interface MarketData {
  symbol: string
  name: string | null
  price: number
  change: number
  volume: string
  timestamp: Date
}

interface MarketTableProps {
  data: MarketData[]
  loading?: boolean
  error?: string | null
  type: string
  className?: string
}

export function MarketTable({ data, loading, error, type, className }: MarketTableProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center p-6 text-red-500">
        <AlertCircle className="mr-2 h-4 w-4" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Name</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">24h Change</TableHead>
            <TableHead className="text-right pr-6">Volume</TableHead>
            <TableHead className="text-right whitespace-nowrap min-w-[200px]">Last Update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : (
            data.map((item) => {
              const uniqueKey = `${item.symbol}-${new Date(item.timestamp).getTime()}`;
              return (
                <TableRow key={uniqueKey}>
                  <TableCell className="font-medium text-left">{item.name}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className={cn(
                    "text-right",
                    item.change > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">${(Number(item.volume) / 1e9).toFixed(2)}B</TableCell>
                  <TableCell className="text-right whitespace-nowrap pl-6">
                    {format(new Date(new Date(item.timestamp).toUTCString()), 'MMM dd, yyyy HH:mm')} GMT
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
