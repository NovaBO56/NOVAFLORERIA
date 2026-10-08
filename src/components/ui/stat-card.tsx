import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"

type StatCardProps = {
  label: string
  value: string
  description?: string
  icon?: ReactNode
  trend?: string
}

export function StatCard({
  label,
  value,
  description,
  icon,
  trend,
}: StatCardProps) {
  return (
    <Card className="nova-fade min-w-0">
      <CardContent className="flex items-start justify-between gap-4 p-0">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-text-secondary">
            {label}
          </p>

          <p key={value} className="nova-value mt-2 truncate text-2xl font-semibold leading-none tracking-tight tabular-nums text-text sm:text-[28px]">
            {value}
          </p>

          {trend ? (
            <p className="mt-2 text-xs font-medium text-leaf">
              {trend}
            </p>
          ) : description ? (
            <p className="mt-2 text-xs leading-5 text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>

        {icon ? (
          <div
            className={[
              "flex size-10 shrink-0 items-center justify-center",
              "rounded-xl",
              "bg-brand-soft",
              "text-brand",
              "[&_svg]:size-5",
              "[&_svg]:stroke-[1.7]",
            ].join(" ")}
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
