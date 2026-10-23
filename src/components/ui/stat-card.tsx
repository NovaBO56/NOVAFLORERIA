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
  const numericValue = /^(?:Bs\s)?-?[\d.,]+$/.test(value);
  const scrollValue = numericValue && value.length > 14;
  return (
    <Card className="nova-fade min-w-0">
      <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 p-0">
        <div className="contents">
          <p className="min-w-0 self-center text-xs font-medium uppercase tracking-[0.05em] text-text-secondary">
            {label}
          </p>

          <p key={value} className={`nova-value col-span-2 min-w-0 mt-2 font-semibold leading-normal tracking-tight tabular-nums text-text ${numericValue ? "whitespace-nowrap text-[clamp(1rem,2vw,1.75rem)]" : "[overflow-wrap:anywhere] text-2xl sm:text-[28px]"} ${scrollValue ? "overflow-x-auto overflow-y-hidden py-1" : ""}`} tabIndex={scrollValue ? 0 : undefined} role={scrollValue ? "region" : undefined} aria-label={scrollValue ? `${label}: ${value}` : undefined}>
            {value}
          </p>

          {trend ? (
            <p className="col-span-2 mt-2 text-xs font-medium text-leaf">
              {trend}
            </p>
          ) : description ? (
            <p className="col-span-2 mt-2 text-xs leading-5 text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>

        {icon ? (
          <div
            className={[
              "col-start-2 row-start-1 flex size-10 shrink-0 items-center justify-center",
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
