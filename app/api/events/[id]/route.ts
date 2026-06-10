import { NextResponse } from "next/server";
import { validateEventPayload, type EventPayload } from "@/features/events/validators";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/events/[id]">,
) {
  const supabase = getSupabase();
  const { id: rawId } = await context.params;
  const id = rawId?.trim();

  if (!id) {
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  }

  const payload = (await request.json()) as EventPayload;
  const validated = validateEventPayload(payload);

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("events")
    .update(validated.data)
    .eq("id", id)
    .select("id,title,description,timeline_year,created_at,family_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/events/[id]">,
) {
  const supabase = getSupabase();
  const { id: rawId } = await context.params;
  const id = rawId?.trim();

  if (!id) {
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  }

  await supabase
    .from("media")
    .delete()
    .eq("entity_type", "event")
    .eq("entity_id", id);

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
