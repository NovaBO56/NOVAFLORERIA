import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type SectionCardProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div
          className={[
            "flex flex-col gap-3",
            "sm:flex-row sm:items-start sm:justify-between",
          ].join(" ")}
        >
          <div className="min-w-0">
            <CardTitle
              className={[
                "text-lg leading-tight",
                "font-semibold",
                "in-[.theme-public]:font-display",
                "in-[.theme-public]:font-medium",
              ].join(" ")}
            >
              {title}
            </CardTitle>

            {description ? (
              <CardDescription className="mt-1.5">
                {description}
              </CardDescription>
            ) : null}
          </div>

          {action ? (
            <div className="shrink-0">
              {action}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  )
}