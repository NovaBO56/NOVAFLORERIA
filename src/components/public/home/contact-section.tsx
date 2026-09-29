import { Clock3, Camera, MapPin, MessageCircle, Phone } from "lucide-react";

const contactItems = [
  {
    icon: MapPin,
    title: "Visítanos",
    text: "Cochabamba, Bolivia",
  },
  {
    icon: Phone,
    title: "Llámanos",
    text: "Atención por teléfono",
  },
  {
    icon: Clock3,
    title: "Horarios",
    text: "Consulta nuestros horarios",
  },
];

export function ContactSection() {
  return (
    <section id="contacto" className="border-t border-[#e8e0ea] bg-[#faf7fb] py-16 sm:py-20">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-[#9270a4]" />

              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#735a7d]">
                Contacto
              </span>
            </div>

            <h2 className="max-w-xl text-3xl font-black leading-tight text-[#403344] sm:text-4xl">
              Estamos aquí para ayudarte
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#756a79] sm:text-base">
              ¿Tienes alguna consulta sobre un arreglo, un pedido o una
              ocasión especial? Ponte en contacto con nosotros.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {contactItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#e8e0ea] bg-white p-5"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#f3ebf6] text-[#65358e]">
                      <Icon size={18} strokeWidth={1.7} />
                    </div>

                    <p className="mt-4 text-sm font-black text-[#403344]">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#7b707f]">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-[#ded2e2] bg-white p-7 shadow-[0_12px_35px_rgba(65,39,75,.06)] sm:p-9">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#65358e] text-white">
              <MessageCircle size={21} />
            </div>

            <h3 className="mt-5 text-xl font-black text-[#403344]">
              ¿Quieres hablar con nosotros?
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#756a79]">
              Escríbenos y cuéntanos qué necesitas. Te ayudaremos a encontrar
              el detalle ideal.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#65358e] px-5 text-xs font-black text-white transition hover:bg-[#572d7a]"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>

              <a
                href="#"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8c8de] bg-white px-5 text-xs font-black text-[#55455c] transition hover:border-[#65358e] hover:text-[#65358e]"
              >
                <Camera size={15} />
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}