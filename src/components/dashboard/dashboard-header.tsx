import { ReactNode } from "react"

interface DashboardHeaderProps {
  heading: ReactNode
  text?: string
  children?: React.ReactNode
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="grid gap-1 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {heading}
        </h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  )
}
