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
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import Image from "next/image"
import { useState } from "react"
import Link from "next/link"

interface MarketData {
  symbol: string
  name: string | null
  price: number
  change: number
  volume: string
  timestamp: Date
  logo_url?: string | null
  market_cap: number
  id: string
}

type SortField = 'name' | 'price' | 'change' | 'market_cap' | 'volume' | 'timestamp'
type SortDirection = 'asc' | 'desc' | null

interface MarketTableProps {
  data: MarketData[]
  loading?: boolean
  error?: string | null
  type: string
  className?: string
}

export function MarketTable({ data, loading, error, type, className }: MarketTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction or reset
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />
    if (sortDirection === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />
    if (sortDirection === 'desc') return <ArrowDown className="ml-2 h-4 w-4" />
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortField || !sortDirection) return 0

    const multiplier = sortDirection === 'asc' ? 1 : -1

    switch (sortField) {
      case 'name':
        return multiplier * ((a.name || '').localeCompare(b.name || ''))
      case 'price':
        return multiplier * (a.price - b.price)
      case 'change':
        return multiplier * (a.change - b.change)
      case 'market_cap':
        return multiplier * (a.market_cap - b.market_cap)
      case 'volume':
        return multiplier * (Number(a.volume) - Number(b.volume))
      case 'timestamp':
        return multiplier * (a.timestamp.getTime() - b.timestamp.getTime())
      default:
        return 0
    }
  })

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
            <TableHead 
              className="text-left cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Name
                {getSortIcon('name')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('price')}
            >
              <div className="flex items-center justify-end">
                Price
                {getSortIcon('price')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('change')}
            >
              <div className="flex items-center justify-end">
                24h Change
                {getSortIcon('change')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('market_cap')}
            >
              <div className="flex items-center justify-end">
                Market Cap
                {getSortIcon('market_cap')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('volume')}
            >
              <div className="flex items-center justify-end">
                Volume
                {getSortIcon('volume')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50 whitespace-nowrap min-w-[200px]"
              onClick={() => handleSort('timestamp')}
            >
              <div className="flex items-center justify-end">
                Last Update
                {getSortIcon('timestamp')}
              </div>
            </TableHead>
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
              </TableRow>
            ))
          ) : (
            sortedData.map((item, index) => {
              return (
                <TableRow key={`${item.symbol}-${item.timestamp}`}>
                  <TableCell>
                    <Link 
                      href={`/crypto/${item.symbol.toLowerCase()}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      {item.logo_url ? (
                        <Image
                          src={item.logo_url}
                          alt={`${item.name} logo`}
                          className="object-contain"
                          width={24}
                          height={24}
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">{item.symbol?.[0]}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.symbol}</div>
                      </div>
                    </Link>
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
