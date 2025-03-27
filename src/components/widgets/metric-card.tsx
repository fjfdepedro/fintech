import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'increase' | 'decrease'
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'increase',
  className
}: MetricCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={cn(
            "text-xs",
            changeType === 'increase' ? "text-green-500" : "text-red-500"
          )}>
            {changeType === 'increase' ? '↑' : '↓'} {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
