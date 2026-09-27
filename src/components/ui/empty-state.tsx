import type { ReactNode } from "react"

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex min-h-[220px]",
        "flex-col items-center justify-center",
        "px-6 py-10",
        "text-center",
      ].join(" ")}
    >
      {icon ? (
        <div
          className={[
            "mb-4",
            "flex size-12 items-center justify-center",
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

      <h3
        className={[
          "text-lg leading-tight",
          "font-semibold",
          "text-text",
          "in-[.theme-public]:font-display",
          "in-[.theme-public]:font-medium",
        ].join(" ")}
      >
        {title}
      </h3>

      {description ? (
        <p
          className={[
            "mt-2",
            "max-w-md",
            "text-sm leading-6",
            "text-text-secondary",
          ].join(" ")}
        >
          {description}
        </p>
      ) : null}

      {action ? (
        <div className="mt-5">
          {action}
        </div>
      ) : null}
    </div>
  )
}