import { Heart, Sparkles, Truck } from "lucide-react";

const services = [
  {
    icon: Truck,
    title: "Entrega coordinada",
    text: "Llevamos tu pedido hasta donde necesitas.",
  },
  {
    icon: Sparkles,
    title: "Detalles especiales",
    text: "Cada arreglo se prepara con dedicación.",
  },
  {
    icon: Heart,
    title: "Compra segura",
    text: "Un proceso simple y claro para ti.",
  },
];

export function ServiceStrip() {
  return (
    <section className="border-b border-[#e8e0ea] bg-white">
      <div className="mx-auto grid max-w-[1100px] sm:grid-cols-3">
        {services.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className={`flex items-center gap-4 px-7 py-6 ${
                index > 0
                  ? "border-t border-[#eee7f0] sm:border-l sm:border-t-0"
                  : ""
              }`}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f3ebf6] text-[#65358e]">
                <Icon size={19} strokeWidth={1.7} />
              </div>

              <div>
                <p className="text-sm font-black text-[#403344]">
                  {item.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#7b707f]">
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}