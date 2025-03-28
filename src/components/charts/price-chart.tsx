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
  height = 300,
  className = ""
}: PriceChartProps) {
  const color = getColorForSymbol(symbol)

  const formattedData = data.map(point => ({
    date: format(new Date(point.date), 'HH:mm'),
    [symbol]: point.value
  }))

  const customTooltip = ({ payload, active, label }: any) => {
    if (!active || !payload) return null;

    // Encontrar el dato original que corresponde a esta hora
    const originalData = data.find(d => 
      format(new Date(d.date), 'HH:mm') === label
    );

    return (
      <div className="w-56 rounded-tremor-default border border-tremor-border bg-tremor-background p-2 text-tremor-default shadow-tremor-dropdown">
        <div className="flex flex-1 space-x-2.5">
          <div className={`flex w-1 flex-col bg-${color}-500 rounded`} />
          <div className="space-y-1">
            <p className="text-tremor-content text-xs">
              {format(new Date(originalData?.date || data[0].date), 'MMM dd, HH:mm')}
            </p>
            <p className="font-medium text-tremor-content-emphasis">
              ${Number(payload[0].value).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const minValue = Math.min(...data.map(d => d.value)) * 0.995;
  const maxValue = Math.max(...data.map(d => d.value)) * 1.005;

  const chart = (
    <div style={{ height: `${height}px` }} className="relative">
      <AreaChart
        className="h-full w-full [&_svg]:!overflow-visible
          [&_path[fill]]:!opacity-40 
          [&_path[stroke]]:!stroke-[2] 
          [&_.tremor-AreaChart-axisLine]:hidden 
          [&_text]:!text-[10px]
          [&_text]:!text-muted-foreground/60
          [&_.tremor-AreaChart-line]:!hidden"
        data={formattedData}
        index="date"
        categories={[symbol]}
        colors={[color]}
        valueFormatter={(value) => `$${Number(value).toFixed(2)}`}
        showYAxis={true}
        showXAxis={true}
        showLegend={false}
        showGridLines={false}
        showTooltip={true}
        customTooltip={customTooltip}
        minValue={minValue}
        maxValue={maxValue}
        startEndOnly={true}
        autoMinValue={false}
        curveType="natural"
        yAxisWidth={42}
        showGradient={false}
      />
    </div>
  )

  if (!title) return chart

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-4 bg-muted/50">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {chart}
      </CardContent>
    </Card>
  )
}
