import { NextResponse } from "next/server";
import { validateMediaPayload, type MediaPayload } from "@/features/media/validators";
import { getSupabase } from "@/lib/supabase";
import { withDisplayUrl } from "@/lib/supabase/storage";
import { validatePositiveInteger } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/media/[id]">,
) {
  const supabase = getSupabase();
  const { id: rawId } = await context.params;
  const id = validatePositiveInteger(rawId);

  if (!id) {
    return NextResponse.json({ error: "Invalid media id." }, { status: 400 });
  }

  const payload = (await request.json()) as MediaPayload;
  const validated = validateMediaPayload(payload);

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("media")
    .update(validated.data)
    .eq("id", id)
    .select("id,file_name,file_url,file_type,created_at,family_id,entity_type,entity_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: await withDisplayUrl(supabase, data) });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/media/[id]">,
) {
  const supabase = getSupabase();
  const { id: rawId } = await context.params;
  const id = validatePositiveInteger(rawId);

  if (!id) {
    return NextResponse.json({ error: "Invalid media id." }, { status: 400 });
  }

  const { error } = await supabase.from("media").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
