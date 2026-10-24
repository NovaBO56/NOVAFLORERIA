import { ChevronDown } from "lucide-react";
import { DAY_NAMES, dayHoursLabel, orderedWeek } from "@/lib/public/format";
import type { WeekDay } from "@/lib/public/types";

/** Same configured week as the footer, revealed only when a visitor needs it. */
export function WeeklyHours({ week }: { week: WeekDay[] }) {
  const days = orderedWeek(week);
  if (!days.length) return null;
  return <details className="group mt-4 rounded-2xl border border-[#e6d7d8] bg-white/70 text-sm text-[#645460]">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#873c58] [&::-webkit-details-marker]:hidden">
      Ver horario semanal<ChevronDown size={16} aria-hidden className="shrink-0 group-open:rotate-180" />
    </summary>
    <dl className="space-y-2 border-t border-[#e6d7d8] px-4 py-4 text-xs leading-5">
      {days.map(day => <div key={day.day_of_week} className="flex flex-wrap justify-between gap-x-4 gap-y-1"><dt>{DAY_NAMES[day.day_of_week]}</dt><dd className="font-bold">{dayHoursLabel(day)}</dd></div>)}
    </dl>
  </details>;
}
