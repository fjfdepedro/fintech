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
import { formatDate } from "@/lib/utils/date"
import Image from "next/image"

interface MarketData {
  symbol: string
  name: string | null
  price: number
  change: number
  volume: string
  timestamp: Date
  logo_url?: string | null
  market_cap: number
  high_24h?: number
  low_24h?: number
  total_supply?: number
  circulating_supply?: number
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
            <TableHead className="text-right">Market Cap</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right whitespace-nowrap min-w-[200px]">Last Update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : (
            data.map((item) => {
              return (
                <TableRow key={`${item.symbol}-${item.timestamp}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.logo_url ? (
                        <div className="relative h-6 w-6 rounded-full overflow-hidden">
                          <Image
                            src={item.logo_url}
                            alt={`${item.name} logo`}
                            className="object-contain"
                            width={24}
                            height={24}
                          />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">{item.symbol?.[0]}</span>
                        </div>
                      )}
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground text-sm">({item.symbol})</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-base font-medium">${item.price.toFixed(2)}</TableCell>
                  <TableCell className={cn(
                    "text-right text-base font-medium",
                    item.change > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right text-base font-medium">
                    ${(item.market_cap / 1e9).toFixed(2)}B
                  </TableCell>
                  <TableCell className="text-right text-base font-medium">
                    ${formatVolume(Number(item.volume))}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap pl-6">
                    {formatDate(item.timestamp)}
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

function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`
  }
  return volume.toFixed(2)
}
