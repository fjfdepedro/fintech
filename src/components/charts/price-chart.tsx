"use client"

import { Card, CardContent } from "@/components/ui/card"
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

  // Solo procesar datos si existen y son válidos
  const validData = data
    .filter(point => point && point.value && !isNaN(point.value))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  if (validData.length === 0) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardContent className="p-6 text-center text-muted-foreground">
          No data available for this period
        </CardContent>
      </Card>
    )
  }

  const formattedData = validData.map(point => ({
    date: format(new Date(point.date), 'MMM dd, yyyy HH:mm'),
    [symbol]: point.value
  }))

  const customTooltip = ({ payload, active, label }: any) => {
    if (!active || !payload) return null;

    // Encontrar el dato original que corresponde a esta fecha exacta
    const originalData = validData.find(d => 
      format(new Date(d.date), 'MMM dd, yyyy HH:mm') === label
    ) || validData[validData.length - 1]; // Usar el último dato si no se encuentra coincidencia

    return (
      <div className="w-56 rounded-tremor-default border border-tremor-border bg-tremor-background p-2 text-tremor-default shadow-tremor-dropdown">
        <div className="flex flex-1 space-x-2.5">
          <div className={`flex w-1 flex-col bg-${color}-500 rounded`} />
          <div className="space-y-1">
            <p className="text-tremor-content text-xs">
              {format(new Date(originalData.date), 'MMM dd, yyyy HH:mm')} GMT
            </p>
            <p className="font-medium text-tremor-content-emphasis">
              ${Number(payload[0].value).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const minValue = Math.min(...validData.map(d => d.value)) * 0.995;
  const maxValue = Math.max(...validData.map(d => d.value)) * 1.005;

  const chart = (
    <div style={{ height: `${height}px` }} className="relative">
      <AreaChart
        className="h-full w-full [&_svg]:!overflow-visible [&_text]:text-xs [&_text]:font-normal"
        data={formattedData}
        index="date"
        categories={[symbol]}
        colors={[color]}
        valueFormatter={(value) => {
          if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}k`
          }
          if (value >= 1) {
            return `$${value.toFixed(2)}`
          }
          if (value >= 0.01) {
            return `$${value.toFixed(4)}`
          }
          if (value >= 0.0001) {
            return `$${value.toFixed(6)}`
          }
          return `$${value.toLocaleString('en-US', { 
            minimumFractionDigits: 8,
            maximumFractionDigits: 8
          })}`
        }}
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
        yAxisWidth={90}
        showGradient={false}
      />
    </div>
  )

  if (!title) return chart

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {chart}
      </CardContent>
    </Card>
  )
}
