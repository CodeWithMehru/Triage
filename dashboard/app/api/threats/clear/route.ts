import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createServerSupabase();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const { error } = await supabase
    .from("threat_events")
    .delete()
    .neq("threat_type", "__impossible_sentinel_clear__");

  if (error) {
    console.error("[supabase] clear threats failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Threat data wiped successfully" });
}
