import type { ReactNode } from "react"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header
      className={[
        "flex flex-col gap-5",
        "border-b border-border-decorative",
        "pb-6",
        "2xl:flex-row 2xl:items-end 2xl:justify-between",
        "2xl:gap-8",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p
            className={[
              "mb-2",
              "text-xs leading-5",
              "font-semibold",
              "uppercase",
              "tracking-[0.08em]",
              "text-brand",
            ].join(" ")}
          >
            {eyebrow}
          </p>
        ) : null}

        <h1
          className={[
            "text-3xl leading-tight",
            "font-semibold",
            "tracking-tight",
            "text-text",
            "sm:text-[34px]",
            "in-[.theme-public]:font-display",
            "in-[.theme-public]:font-medium",
          ].join(" ")}
        >
          {title}
        </h1>

        {description ? (
          <p
            className={[
              "mt-2",
              "max-w-2xl",
              "text-sm leading-6",
              "text-text-secondary",
            ].join(" ")}
          >
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div
          className={[
            "flex min-w-0 max-w-full",
            "flex-wrap items-center",
            "gap-2",
          ].join(" ")}
        >
          {actions}
        </div>
      ) : null}
    </header>
  )
}
