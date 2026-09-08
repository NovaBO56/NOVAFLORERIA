
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";

export async function GET() {
  try {
    const profile = await requireAdmin();

    return NextResponse.json({
      success: true,
      message: "Acceso administrativo autorizado.",
      user: {
        id: profile.id,
        role: profile.role,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Acceso no autorizado.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 403,
      },
    );
  }
}
