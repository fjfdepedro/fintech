'use client'

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
import Image from "next/image"

interface CryptoMetadata {
  symbol: string
  logo_url: string | null
  name: string
}

interface CryptoMetadataTableProps {
  data: CryptoMetadata[]
  loading: boolean
}

export function CryptoMetadataTable({ data, loading }: CryptoMetadataTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Logo</TableHead>
          <TableHead>Símbolo</TableHead>
          <TableHead>Nombre</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((crypto) => (
          <TableRow key={crypto.symbol}>
            <TableCell>
              {crypto.logo_url && (
                <Image
                  src={crypto.logo_url}
                  alt={crypto.symbol}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
            </TableCell>
            <TableCell>{crypto.symbol}</TableCell>
            <TableCell>{crypto.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 