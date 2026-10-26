import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/validations/database-values";
import { orderScheduleSchema, scheduleInstant } from "@/validations/order-schedule";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireEmployeeOrAdmin(); } catch { return NextResponse.json({ success: false, message: "Personal activo requerido." }, { status: 403 }); }
  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ success: false, message: "ID no válido." }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "JSON no válido." }, { status: 400 }); }
  const parsed = orderScheduleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? "Horario no válido." }, { status: 400 });
  try {
    const client = await createClient(); const value = parsed.data;
    const { error, data } = await client.rpc("set_order_schedule", { p_order: id, p_when: scheduleInstant(value.date, value.time), p_status: value.status, p_revision: value.revision, p_client_confirmed: value.client_confirmed });
    if (error) {
      const status = error.code === "40001" ? 409 : error.code === "P0002" ? 404 : error.code === "42501" ? 403 : error.code === "P0001" ? 400 : 500;
      return NextResponse.json({ success: false, message: status === 500 ? "No se pudo guardar el horario." : error.message }, { status });
    }
    return NextResponse.json({ success: true, revision: data });
  } catch { return NextResponse.json({ success: false, message: "No se pudo guardar el horario." }, { status: 500 }); }
}
