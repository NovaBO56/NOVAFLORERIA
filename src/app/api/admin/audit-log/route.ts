import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { auditTrailQuerySchema } from "@/validations/audit";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const result = auditTrailQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]?.message ?? "Parámetros inválidos.",
        },
        { status: 400 },
      );
    }

    const { limit, offset } = result.data;
    const supabase = await createClient();

    // La función ya exige is_admin() por su cuenta (defensa en
    // profundidad: aunque requireAdmin() falle o se elimine por
    // error, la base de datos igual bloquea a no-administradores).
    const { data, error } = await supabase.rpc("get_audit_trail", {
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error("Error obteniendo el historial de auditoría:", error);
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo obtener el historial de auditoría.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, entries: data ?? [] });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo obtener el historial de auditoría.";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}