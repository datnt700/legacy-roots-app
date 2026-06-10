import { NextResponse } from "next/server";
import { validateMediaPayload, type MediaPayload } from "@/features/media/validators";
import { getSupabase } from "@/lib/supabase";
import { withDisplayUrl } from "@/lib/supabase/storage";

export async function POST(
  request: Request,
  context: RouteContext<"/api/events/[id]/media">,
) {
  const supabase = getSupabase();
  const { id: rawId } = await context.params;
  const eventId = rawId?.trim();

  if (!eventId) {
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,family_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: eventError?.message || "Event was not found." },
      { status: 404 },
    );
  }

  const payload = (await request.json()) as MediaPayload;
  const validated = validateMediaPayload(payload);

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { data: media, error: mediaError } = await supabase
    .from("media")
    .insert({
      ...validated.data,
      family_id: event.family_id,
      entity_type: "event",
      entity_id: String(event.id),
    })
    .select("id,file_name,file_url,file_type,created_at,family_id,entity_type,entity_id")
    .single();

  if (mediaError) {
    return NextResponse.json({ error: mediaError.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: await withDisplayUrl(supabase, media) },
    { status: 201 },
  );
}
