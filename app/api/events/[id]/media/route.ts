import { NextResponse } from "next/server";
import { validateMediaPayload, type MediaPayload } from "@/features/media/validators";
import { getSupabase } from "@/lib/supabase";
import { withDisplayUrl } from "@/lib/supabase/storage";
import { validatePositiveInteger } from "@/lib/validation";

export async function POST(
  request: Request,
  context: RouteContext<"/api/events/[id]/media">,
) {
  const supabase = getSupabase();
  const { id: rawId } = await context.params;
  const eventId = validatePositiveInteger(rawId);

  if (!eventId) {
    return NextResponse.json({ error: "Invalid event id." }, { status: 400 });
  }

  const payload = (await request.json()) as MediaPayload;
  const validated = validateMediaPayload(payload);

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { data: media, error: mediaError } = await supabase
    .from("media")
    .insert(validated.data)
    .select("id,file_name,file_url,file_type,created_at")
    .single();

  if (mediaError) {
    return NextResponse.json({ error: mediaError.message }, { status: 500 });
  }

  const { error: linkError } = await supabase.from("event_media").insert({
    event_id: eventId,
    media_id: media.id,
  });

  if (linkError) {
    await supabase.from("media").delete().eq("id", media.id);
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: await withDisplayUrl(supabase, media) },
    { status: 201 },
  );
}
