"use client";

export type CustomizationOption = {
  id: string;
  option_type: string;
  name: string;
  value: string | null;
  extra_price: number;
};

type CustomizationProps = {
  options: CustomizationOption[];
  selectedOptionIds: string[];
  onChange: (ids: string[]) => void;
};

export function Customization({
  options,
  selectedOptionIds,
  onChange,
}: CustomizationProps) {
  if (options.length === 0) {
    return null;
  }

  function toggleOption(id: string) {
    if (selectedOptionIds.includes(id)) {
      onChange(selectedOptionIds.filter((item) => item !== id));
      return;
    }

    onChange([...selectedOptionIds, id]);
  }

  return (
    <div className="mt-8 border-t border-[#e8e0ea] pt-7">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9270a4]">
        Personaliza tu pedido
      </p>

      <h3 className="mt-2 text-lg font-black text-[#403344]">
        Detalles especiales
      </h3>

      <div className="mt-4 space-y-3">
        {options.map((option) => {
          const selected = selectedOptionIds.includes(option.id);

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition ${
                selected
                  ? "border-[#65358e] bg-[#f7f1f9]"
                  : "border-[#e8e0ea] bg-white hover:border-[#cdbbd3]"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleOption(option.id)}
                  className="size-4 accent-[#65358e]"
                />

                <div className="min-w-0">
                  <p className="text-sm font-black text-[#403344]">
                    {option.name}
                  </p>

                  {option.value && (
                    <p className="mt-0.5 text-xs text-[#817483]">
                      {option.value}
                    </p>
                  )}
                </div>
              </div>

              {Number(option.extra_price) > 0 && (
                <span className="shrink-0 text-xs font-black text-[#65358e]">
                  +Bs {Number(option.extra_price).toFixed(2)}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}