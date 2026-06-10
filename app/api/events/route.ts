import { NextResponse } from "next/server";
import { validateEventPayload, type EventPayload } from "@/features/events/validators";
import type { MediaRow } from "@/features/media/types";
import { getSupabase } from "@/lib/supabase";
import { withDisplayUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id,title,description,timeline_year,created_at")
      .order("timeline_year", { ascending: true });

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    const { data: links, error: linksError } = await supabase
      .from("event_media")
      .select("event_id,media_id");

    if (linksError) {
      return NextResponse.json({ error: linksError.message }, { status: 500 });
    }

    const mediaIds = [...new Set((links ?? []).map((link) => link.media_id))];
    const { data: media, error: mediaError } = mediaIds.length
      ? await supabase
          .from("media")
          .select("id,file_name,file_url,file_type,created_at")
          .in("id", mediaIds)
      : { data: [], error: null };

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 });
    }

    const signedMedia = await Promise.all(
      ((media ?? []) as MediaRow[]).map((item) => withDisplayUrl(supabase, item)),
    );
    const mediaById = new Map(signedMedia.map((item) => [item.id, item]));
    const data = (events ?? []).map((event) => ({
      ...event,
      media: (links ?? [])
        .filter((link) => link.event_id === event.id)
        .map((link) => mediaById.get(link.media_id))
        .filter(Boolean),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load events.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    const payload = (await request.json()) as EventPayload;
    const validated = validateEventPayload(payload);

    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("events")
      .insert(validated.data)
      .select("id,title,description,timeline_year,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { ...data, media: [] } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create event.",
      },
      { status: 500 },
    );
  }
}
