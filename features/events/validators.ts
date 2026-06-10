export type EventPayload = {
  title?: unknown;
  description?: unknown;
  timeline_year?: unknown;
};

export function validateEventPayload(payload: EventPayload) {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const timelineYear = Number(payload.timeline_year);

  if (!title || !description || !Number.isInteger(timelineYear)) {
    return {
      error: "title, description and timeline_year are required.",
    };
  }

  return {
    data: {
      title,
      description,
      timeline_year: timelineYear,
    },
  };
}
