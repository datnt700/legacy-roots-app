import { NextResponse } from "next/server";
import { validateEventPayload, type EventPayload } from "@/features/events/validators";
import type { MediaRow } from "@/features/media/types";
import { getSupabase } from "@/lib/supabase";
import { withDisplayUrl } from "@/lib/supabase/storage";
import { getDefaultFamilyId } from "@/lib/family";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabase();
    const familyId = await getDefaultFamilyId();
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id,title,description,timeline_year,created_at,family_id")
      .eq("family_id", familyId)
      .order("timeline_year", { ascending: true });

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    const eventIds = (events ?? []).map((event) => String(event.id));
    const { data: media, error: mediaError } = eventIds.length
      ? await supabase
          .from("media")
          .select("id,file_name,file_url,file_type,created_at,family_id,entity_type,entity_id")
          .eq("family_id", familyId)
          .eq("entity_type", "event")
          .in("entity_id", eventIds)
      : { data: [], error: null };

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 });
    }

    const signedMedia = await Promise.all(
      ((media ?? []) as MediaRow[]).map((item) => withDisplayUrl(supabase, item)),
    );
    const data = (events ?? []).map((event) => ({
      ...event,
      media: signedMedia.filter((item) => item.entity_id === String(event.id)),
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
    const familyId = await getDefaultFamilyId();
    const payload = (await request.json()) as EventPayload;
    const validated = validateEventPayload(payload);

    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("events")
      .insert({ ...validated.data, family_id: familyId })
      .select("id,title,description,timeline_year,created_at,family_id")
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
