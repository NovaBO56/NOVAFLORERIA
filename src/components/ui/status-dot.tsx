type StatusDotProps = {
  status: "success" | "warning" | "danger" | "neutral"
  label?: string
}

const statusClasses = {
  success: "bg-leaf",
  warning: "bg-[#B98900]",
  danger: "bg-danger",
  neutral: "bg-text-secondary",
} as const

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-text">
      <span
        aria-hidden="true"
        className={[
          "size-2 shrink-0 rounded-full",
          "ring-2 ring-offset-1 ring-offset-surface",
          statusClasses[status],
        ].join(" ")}
      />

      {label ? <span>{label}</span> : null}
    </span>
  )
}