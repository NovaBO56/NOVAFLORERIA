import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only explicit, public product attributes. Never infer an occasion from a name
// or silently omit values after PostgREST's first page.
export async function GET() {
  try {
    const client = await createClient();
    const occasions = new Set<string>();
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.from("products").select("id, occasion")
        .eq("is_active", true).not("occasion", "is", null)
        .order("id", { ascending: true }).range(offset, offset + pageSize - 1);
      if (error || !data) return NextResponse.json({ success: false, message: "No pudimos cargar las ocasiones." }, { status: 503 });
      for (const row of data) if (typeof row.occasion === "string" && row.occasion.trim()) occasions.add(row.occasion);
      if (data.length < pageSize) break;
    }
    return NextResponse.json({ success: true, occasions: [...occasions].sort((a, b) => a.localeCompare(b, "es")) });
  } catch {
    return NextResponse.json({ success: false, message: "No pudimos cargar las ocasiones." }, { status: 503 });
  }
}
