import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { visualPreviewEnabled } from "@/lib/visual-preview/config";
import { visualCatalogResponse, type VisualSnapshot } from "@/lib/visual-preview/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!visualPreviewEnabled(process.env)) return new NextResponse(null, { status: 404 });
    const snapshot: VisualSnapshot = JSON.parse(await readFile(path.join(process.cwd(), ".visual-preview/snapshot.json"), "utf8"));
    if (snapshot.version !== 1 || snapshot.synthetic !== true) throw Error("Missing synthetic snapshot.");
    const result = visualCatalogResponse(snapshot, new URL(request.url));
    return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch {
    return NextResponse.json({ success: false, message: "Vista previa no disponible; falta configuración aislada." }, { status: 503 });
  }
}
