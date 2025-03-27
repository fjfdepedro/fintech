"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart } from "@tremor/react"
import { format } from "date-fns"

interface PriceData {
  date: Date
  value: number
}

interface PriceChartProps {
  data: PriceData[]
  title?: string
  symbol: string
  showAxes?: boolean
  height?: number
  className?: string
}

// Array de colores para usar de forma aleatoria
const chartColors = [
  "indigo",
  "rose",
  "orange",
  "emerald",
  "blue",
  "violet",
  "cyan",
  "amber",
  "fuchsia",
  "teal"
]

// Función para obtener un color basado en el símbolo
const getColorForSymbol = (symbol: string) => {
  // Usar el símbolo como semilla para obtener un índice consistente
  const index = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return chartColors[index % chartColors.length];
}

export function PriceChart({ 
  data, 
  title, 
  symbol, 
  showAxes = true,
  height = 400,
  className = ""
}: PriceChartProps) {
  // Usar el símbolo para determinar el color
  const color = getColorForSymbol(symbol)

  const chart = (
    <div style={{ height: `${height}px` }}>
      <AreaChart
        data={data}
        index="date"
        categories={["value"]}
        colors={[color]}
        yAxisWidth={showAxes ? 60 : 0}
        showXAxis={showAxes}
        showYAxis={showAxes}
        showAnimation
        className="h-full"
        customTooltip={({ payload, active }) => {
          if (!active || !payload || !payload[0]?.value) return null;
          
          const value = Array.isArray(payload[0].value) 
            ? payload[0].value[0] 
            : payload[0].value;
          
          const numericValue = typeof value === 'string' ? parseFloat(value) : value;
          
          return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                    Date
                  </span>
                  <span className="font-bold text-muted-foreground">
                    {format(new Date(payload[0].payload.date), "MM/dd/yyyy HH:mm")}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                    Price
                  </span>
                  <span className="font-bold">
                    ${numericValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )
        }}
      />
    </div>
  )

  if (!title) return chart

  return (
    <Card className={`col-span-4 ${className}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chart}
      </CardContent>
    </Card>
  )
}
