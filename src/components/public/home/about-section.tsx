import { Heart, Leaf, Sparkles } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Hecho con cariño",
    text: "Cada detalle se prepara pensando en la persona que lo recibirá.",
  },
  {
    icon: Leaf,
    title: "Flores seleccionadas",
    text: "Buscamos que cada arreglo tenga una presentación especial.",
  },
  {
    icon: Sparkles,
    title: "Momentos únicos",
    text: "Creamos detalles para acompañar las ocasiones que importan.",
  },
];

export function AboutSection() {
  return (
    <section id="nosotros" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl bg-[#e7dce9]">
            <div className="absolute inset-6 border border-white/70" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[110px] leading-none text-[#a98bb2]">
                  ✿
                </div>

                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#78627f]">
                  NOVA FLORERÍA
                </p>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 rounded-xl border border-white/80 bg-white px-5 py-4 shadow-lg">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7a91]">
                Nuestra esencia
              </p>

              <p className="mt-1 text-sm font-black text-[#433548]">
                Flores que hablan
              </p>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-[#9270a4]" />

              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#735a7d]">
                Sobre nosotros
              </span>
            </div>

            <h2 className="max-w-xl text-3xl font-black leading-tight text-[#403344] sm:text-4xl">
              Detalles creados para decir lo que a veces las palabras no
              pueden.
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#756a79] sm:text-base">
              En NOVA creemos que las flores pueden transformar un momento.
              Por eso cuidamos cada arreglo y cada detalle para que puedas
              expresar aquello que quieres transmitir.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon;

                return (
                  <div
                    key={value.title}
                    className="rounded-2xl border border-[#e8e0ea] bg-[#fcfafc] p-5"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#f3ebf6] text-[#65358e]">
                      <Icon size={18} strokeWidth={1.7} />
                    </div>

                    <h3 className="mt-4 text-sm font-black text-[#403344]">
                      {value.title}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-[#7b707f]">
                      {value.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}