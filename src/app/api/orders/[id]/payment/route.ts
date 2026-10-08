import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { trackOrderSchema } from "@/validations/public-catalog";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = trackOrderSchema.safeParse({ order_id: id, customer_phone: body.customer_phone });
    if (!parsed.success) return NextResponse.json({ success: false, message: "El teléfono o pedido no es válido." }, { status: 400 });
    const supabase = await createClient();
    const allowed = await checkRateLimit(supabase, request, "reportPayment");

    if (!allowed) {
      return rateLimitResponse();
    }

    // Solo el servidor puede ejecutar el contrato nuevo. La función comprueba
    // teléfono, estado y monto bajo el mismo bloqueo que serializa los reintentos.
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("create_payment", {
      p_order_id: id,
      p_customer_phone: parsed.data.customer_phone,
    });

    if (error) {
      if (error.code === "P0002") {
        return NextResponse.json({ success: false, message: "No encontramos un pedido con esos datos." }, { status: 404 });
      }
      if (error.code === "P0001") {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
      }
      console.error("Error creando el pago:", error);
      return NextResponse.json(
        { success: false, message: "No se pudo generar el pago para este pedido." },
        { status: 500 },
      );
    }

    const payment = Array.isArray(data) ? data[0] : data;

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "No se pudo generar el pago para este pedido." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, payment });
  } catch {
    return NextResponse.json({ success: false, message: "No se pudo generar el pago." }, { status: 500 });
  }
}
