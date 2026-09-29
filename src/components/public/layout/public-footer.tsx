import { Camera, MapPin, MessageCircle } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#e8e0ea] bg-[#403344] text-white">
      <div className="mx-auto max-w-[1180px] px-6 py-12 sm:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <p className="text-3xl font-black tracking-tight text-white">
              NOVA
            </p>

            <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#cbb7d1]">
              FLORERÍA
            </p>

            <p className="mt-5 max-w-sm text-sm leading-6 text-[#d7ccd9]">
              Arreglos florales, regalos y detalles diseñados para acompañar
              los momentos que quieres recordar.
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#cbb7d1]">
              Navegación
            </p>

            <div className="mt-5 flex flex-col gap-3 text-sm text-[#eee8f0]">
              <a
                href="/"
                className="transition hover:text-white"
              >
                Inicio
              </a>

              <a
                href="/catalogo"
                className="transition hover:text-white"
              >
                Catálogo
              </a>

              <a
                href="/#nosotros"
                className="transition hover:text-white"
              >
                Nosotros
              </a>

              <a
                href="/#contacto"
                className="transition hover:text-white"
              >
                Contacto
              </a>

              <a
                href="/seguimiento"
                className="transition hover:text-white"
              >
                Seguimiento de pedido
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#cbb7d1]">
              Encuéntranos
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0 text-[#d8bddf]"
                />

                <p className="text-sm leading-6 text-[#eee8f0]">
                  Cochabamba, Bolivia
                </p>
              </div>

              <a
                href="#"
                className="flex items-center gap-3 text-sm text-[#eee8f0] transition hover:text-white"
              >
                <MessageCircle
                  size={17}
                  className="text-[#d8bddf]"
                />
                WhatsApp
              </a>

              <a
                href="#"
                className="flex items-center gap-3 text-sm text-[#eee8f0] transition hover:text-white"
              >
                <Camera
                  size={17}
                  className="text-[#d8bddf]"
                />
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-2 text-xs text-[#bfb2c2] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} NOVA FLORERÍA.</p>

            <p>Hecho con dedicación para momentos especiales.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}