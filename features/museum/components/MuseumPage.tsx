"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Heart,
  Home,
  Image as GalleryIcon,
  Lock,
  MapPin,
  Play,
  Search,
  ShieldCheck,
  Sprout,
  Users,
  UserPlus,
  Volume2,
  X,
} from "lucide-react";

const ThreeDVirtualMuseum = dynamic(
  () => import("../../../components/ThreeDVirtualMuseum"),
  { ssr: false },
);

const navItems = [
  { key: "home", label: "Home", icon: Home },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "gallery", label: "Gallery", icon: GalleryIcon },
  { key: "vault", label: "Private Vault", icon: Lock },
];

const markers = [
  { left: "26%", top: "77%" },
  { left: "43%", top: "71%" },
  { left: "61%", top: "75%" },
  { left: "47%", top: "58%" },
];

type TimelineMedia = {
  type: "image" | "video";
  src: string;
  poster?: string;
  alt: string;
  label: string;
};

type TimelineEvent = {
  id: string | number;
  year: string;
  title: string;
  summary: string;
  date: string;
  location: string;
  category: "Family" | "Milestones" | "Legacy";
  icon: typeof Users;
  media: TimelineMedia;
  related: TimelineMedia[];
};

type MediaRecord = {
  id: number;
  file_name: string;
  file_url: string;
  file_type: "image" | "video" | string;
  created_at: string | null;
};

type EventRecord = {
  id: number;
  title: string;
  description: string;
  timeline_year: number;
  created_at: string | null;
  media: MediaRecord[];
};

type MediaFormState = {
  fileName: string;
  fileUrl: string;
  fileType: "image" | "video";
};

type EventFormState = {
  title: string;
  description: string;
  timelineYear: string;
};

const emptyMediaForm: MediaFormState = {
  fileName: "",
  fileUrl: "",
  fileType: "image",
};

const emptyEventForm: EventFormState = {
  title: "",
  description: "",
  timelineYear: "",
};

const timelineEvents: TimelineEvent[] = [
  {
    id: "family-begins",
    year: "1940",
    title: "Our Family Begins",
    summary:
      "The journey of our family began with values of hard work and togetherness.",
    date: "January 18, 1940",
    location: "Jaipur, India",
    category: "Family",
    icon: Users,
    media: {
      type: "image",
      src: "https://images.unsplash.com/photo-1581579185169-97323ba4f762?auto=format&fit=crop&q=80&w=900",
      alt: "Restored portrait of the first generation",
      label: "Founders Portrait",
    },
    related: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1519682577862-22b62b24e493?auto=format&fit=crop&q=80&w=500",
        alt: "Old family letter",
        label: "First Letter",
      },
      {
        type: "video",
        src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        poster:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=500",
        alt: "Short archive video",
        label: "Archive Clip",
      },
    ],
  },
  {
    id: "building-dreams",
    year: "1965",
    title: "Building Dreams",
    summary:
      "A new chapter began as the family expanded and new dreams took root.",
    date: "August 4, 1965",
    location: "Mumbai, India",
    category: "Milestones",
    icon: Home,
    media: {
      type: "image",
      src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=900",
      alt: "Family gathered outside a home",
      label: "First Home",
    },
    related: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&q=80&w=500",
        alt: "Family home",
        label: "Home Photo",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=500",
        alt: "House document",
        label: "House Deed",
      },
    ],
  },
  {
    id: "beautiful-union",
    year: "1984",
    title: "A Beautiful Union",
    summary:
      "Meera and Ramesh tied the knot, beginning a lifetime of love and partnership.",
    date: "May 12, 1984",
    location: "New Delhi, India",
    category: "Family",
    icon: Heart,
    media: {
      type: "image",
      src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1100",
      alt: "Wedding portrait",
      label: "Wedding Photo",
    },
    related: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=500",
        alt: "Invitation card",
        label: "Invitation Card",
      },
      {
        type: "video",
        src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        poster:
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=500",
        alt: "Wedding video clip",
        label: "Wedding Video",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&q=80&w=500",
        alt: "Letter from Ramesh",
        label: "Letter",
      },
    ],
  },
  {
    id: "growing-together",
    year: "2000",
    title: "Growing Together",
    summary: "With every new generation, our legacy grows stronger.",
    date: "December 31, 2000",
    location: "Bengaluru, India",
    category: "Legacy",
    icon: Sprout,
    media: {
      type: "image",
      src: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=900",
      alt: "Large family gathering",
      label: "Family Reunion",
    },
    related: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=500",
        alt: "Children and parents together",
        label: "Reunion Photo",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=500",
        alt: "Family place",
        label: "Memory Place",
      },
    ],
  },
];

const timelineFilters = ["All Events", "Family", "Milestones", "Legacy"];

function mediaRecordToTimelineMedia(record: MediaRecord): TimelineMedia {
  return {
    type: record.file_type === "video" ? "video" : "image",
    src: record.file_url,
    alt: record.file_name,
    label: record.file_name,
  };
}

function eventRecordToTimelineEvent(record: EventRecord): TimelineEvent {
  const related = record.media.map(mediaRecordToTimelineMedia);
  const fallbackMedia: TimelineMedia = {
    type: "image",
    src: "https://images.unsplash.com/photo-1519682577862-22b62b24e493?auto=format&fit=crop&q=80&w=900",
    alt: record.title,
    label: "No media yet",
  };

  return {
    id: record.id,
    year: String(record.timeline_year),
    title: record.title,
    summary: record.description,
    date: record.created_at
      ? new Date(record.created_at).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "No date",
    location: "Supabase events",
    category: "Legacy",
    icon: Sprout,
    media: related[0] ?? fallbackMedia,
    related,
  };
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (response.bodyUsed) {
    return {} as T;
  }

  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

function TreeLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className="w-12 h-12 shrink-0"
    >
      <path
        d="M50,15 C45,15 40,18 40,23 C40,25 41,27 42,28 C38,29 35,32 35,36 C35,38 36,40 37,42 C32,43 28,47 28,52 C28,57 32,61 37,62 L37,68 L42,68 L42,75 L45,75 L45,85 L55,85 L55,75 L58,75 L58,68 L63,68 L63,62 C68,61 72,57 72,52 C72,47 68,43 63,42 C64,40 65,38 65,36 C65,32 62,29 58,28 C59,27 60,25 60,23 C60,18 55,15 50,15 Z"
        fill="none"
        stroke="var(--museum-accent)"
        strokeWidth="2"
      />
      <path
        d="M45,85 C42,87 35,88 30,88 M55,85 C58,87 65,88 70,88"
        fill="none"
        stroke="var(--museum-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MediaFrame({
  media,
  className = "",
  controls = false,
}: {
  media: TimelineMedia;
  className?: string;
  controls?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-[#120E0C] ${className}`}>
      {media.type === "video" ? (
        <>
          <video
            className="h-full w-full object-cover"
            src={media.src}
            poster={media.poster}
            controls={controls}
            muted
            playsInline
          />
          {!controls && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/12">
              <div className="h-12 w-12 rounded-full border border-[#F0D7A2]/70 bg-black/45 flex items-center justify-center text-[#F0D7A2] shadow-[0_0_24px_rgba(240,215,162,0.35)]">
                <Play className="h-5 w-5 fill-current" />
              </div>
            </div>
          )}
        </>
      ) : (
        <img
          src={media.src}
          alt={media.alt}
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute left-3 top-3 rounded-full border border-[#C5A059]/30 bg-black/45 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#F0D7A2]">
        {media.type}
      </div>
    </div>
  );
}

function TimelinePanel({
  activeEvent,
  mediaRecords,
  onEditMedia,
  onDeleteMedia,
  deletingId,
}: {
  activeEvent: TimelineEvent;
  mediaRecords: MediaRecord[];
  onEditMedia: (media: MediaRecord) => void;
  onDeleteMedia: (id: number) => void;
  deletingId: number | null;
}) {
  return (
    <aside className="w-full shrink-0 overflow-y-auto rounded-[24px] border border-[#C5A059]/20 bg-[#130F0C]/78 backdrop-blur-md shadow-[0_30px_90px_rgba(0,0,0,0.5)] lg:max-h-[calc(100vh-130px)] lg:w-[360px] xl:w-[430px] 2xl:w-[470px]">
      <MediaFrame
        media={activeEvent.media}
        controls={activeEvent.media.type === "video"}
        className="h-56 border-b border-[#C5A059]/14 sm:h-64 lg:h-[310px]"
      />

      <div className="px-5 py-6 sm:px-7">
        <p className="font-serif text-[28px] leading-none text-[#F0D7A2]">
          {activeEvent.year}
        </p>
        <h2 className="mt-3 font-serif text-[26px] leading-tight text-[#F7EAD7]">
          {activeEvent.title}
        </h2>
        <p className="mt-4 text-[14px] leading-7 text-[#E6D5BD]">
          {activeEvent.summary}
        </p>

        <div className="mt-5 flex flex-wrap gap-5 text-[13px] text-[#D8C8AF]">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#D4AF37]" />
            {activeEvent.date}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#D4AF37]" />
            {activeEvent.location}
          </span>
        </div>

        <div className="mt-7 border-t border-[#C5A059]/12 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-serif text-lg text-[#F7EAD7]">Related Items</p>
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#BCA77B]">
              Photo & video
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {activeEvent.related.map((media) => (
              <div key={`${activeEvent.id}-${media.label}`} className="min-w-0">
                <MediaFrame
                  media={media}
                  className="aspect-square rounded-[10px] border border-[#C5A059]/18"
                />
                <p className="mt-2 truncate text-[11px] text-[#D8C8AF]">
                  {media.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 border-t border-[#C5A059]/12 pt-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-serif text-lg text-[#F7EAD7]">Event Media</p>
              <p className="mt-1 text-[11px] leading-5 text-[#BCA77B]">
                Linked by media.entity_type and media.entity_id for this event.
              </p>
            </div>
            <span className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-[#BCA77B]">
              CRUD
            </span>
          </div>

          {mediaRecords.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#C5A059]/25 bg-black/20 px-4 py-5 text-[12px] leading-6 text-[#D8C8AF]">
              No media linked to this event yet. Add an image or video URL from
              the form on the left.
            </div>
          ) : (
            <div className="space-y-3">
              {mediaRecords.map((record) => (
                <div
                  key={record.id}
                  className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-[14px] border border-[#C5A059]/14 bg-black/20 p-2.5"
                >
                  <MediaFrame
                    media={{
                      type: record.file_type === "video" ? "video" : "image",
                      src: record.file_url,
                      alt: record.file_name,
                      label: record.file_name,
                    }}
                    className="aspect-square rounded-[10px] border border-[#C5A059]/18"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#F7EAD7]">
                      {record.file_name}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#BCA77B]">
                      {record.file_type}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => onEditMedia(record)}
                        className="rounded-full border border-[#C5A059]/25 px-3 py-1 text-[11px] text-[#F0D7A2] transition-colors hover:bg-[#C5A059]/12"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteMedia(record.id)}
                        disabled={deletingId === record.id}
                        className="rounded-full border border-red-300/20 px-3 py-1 text-[11px] text-red-100 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {deletingId === record.id ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function TimelineView() {
  const [activeEventId, setActiveEventId] = useState<string | number>(
    "beautiful-union",
  );
  const [activeFilter, setActiveFilter] = useState("All Events");
  const [eventRecords, setEventRecords] = useState<EventRecord[]>([]);
  const [eventForm, setEventForm] = useState<EventFormState>(emptyEventForm);
  const [mediaForm, setMediaForm] = useState<MediaFormState>(emptyMediaForm);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [eventError, setEventError] = useState("");
  const dbTimelineEvents = eventRecords.map(eventRecordToTimelineEvent);
  const timelineSource = dbTimelineEvents.length
    ? dbTimelineEvents
    : timelineEvents;
  const visibleEvents =
    activeFilter === "All Events"
      ? timelineSource
      : timelineSource.filter((event) => event.category === activeFilter);
  const activeEvent =
    timelineSource.find((event) => event.id === activeEventId) ??
    timelineSource[0];
  const activeEventRecord =
    typeof activeEvent.id === "number"
      ? eventRecords.find((event) => event.id === activeEvent.id)
      : undefined;
  const activeMediaRecords = activeEventRecord?.media ?? [];

  useEffect(() => {
    let isMounted = true;

    fetch("/api/events", { cache: "no-store" })
      .then(async (response) => {
        const result = await readJsonResponse<{
          data?: EventRecord[];
          error?: string;
        }>(response);

        if (!response.ok) {
          throw new Error(result.error ?? "Could not load events.");
        }

        if (isMounted) {
          const events = result.data ?? [];
          setEventRecords(events);
          if (events[0]) {
            setActiveEventId(events[0].id);
          }
        }
      })
      .catch((error) => {
        if (isMounted) {
          setEventError(
            error instanceof Error ? error.message : "Could not load events.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingEvents(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSaveEventEditor(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setIsSavingEvent(true);
    setIsSavingMedia(Boolean(mediaForm.fileUrl));
    setEventError("");
    setMediaError("");

    const payload = {
      title: eventForm.title,
      description: eventForm.description,
      timeline_year: Number(eventForm.timelineYear),
    };
    try {
      const eventResponse = await fetch(
        editingEventId ? `/api/events/${editingEventId}` : "/api/events",
        {
          method: editingEventId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const eventResult = await readJsonResponse<{
        data?: EventRecord;
        error?: string;
      }>(eventResponse);

      if (!eventResponse.ok || !eventResult.data) {
        throw new Error(eventResult.error ?? "Could not save event.");
      }

      const previousRecord = eventRecords.find(
        (record) => record.id === eventResult.data?.id,
      );
      let savedEvent: EventRecord = {
        ...eventResult.data,
        media: previousRecord?.media ?? eventResult.data.media ?? [],
      };

      let mediaSaveError = "";

      if (mediaForm.fileUrl) {
        const mediaResponse = await fetch(
          editingMediaId
            ? `/api/media/${editingMediaId}`
            : `/api/events/${savedEvent.id}/media`,
          {
            method: editingMediaId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_name: mediaForm.fileName || "Uploaded media",
              file_url: mediaForm.fileUrl,
              file_type: mediaForm.fileType,
            }),
          },
        );
        const mediaResult = await readJsonResponse<{
          data?: MediaRecord;
          error?: string;
        }>(mediaResponse);

        if (!mediaResponse.ok || !mediaResult.data) {
          mediaSaveError = mediaResult.error ?? "Could not save media.";
        } else {
          savedEvent = {
            ...savedEvent,
            media: editingMediaId
              ? savedEvent.media.map((media) =>
                  media.id === mediaResult.data?.id ? mediaResult.data : media,
                )
              : [...savedEvent.media, mediaResult.data],
          };
        }
      }

      setEventRecords((records) => {
        const exists = records.some((record) => record.id === savedEvent.id);
        const nextRecords = exists
          ? records.map((record) =>
              record.id === savedEvent.id ? savedEvent : record,
            )
          : [...records, savedEvent];

        return nextRecords.sort((a, b) => a.timeline_year - b.timeline_year);
      });
      setActiveEventId(savedEvent.id);
      if (mediaSaveError) {
        setEditingEventId(savedEvent.id);
        setEventError("");
        setMediaError(`Event saved, but media failed: ${mediaSaveError}`);
      } else {
        setEventForm(emptyEventForm);
        setMediaForm(emptyMediaForm);
        setEditingEventId(null);
        setEditingMediaId(null);
        setIsEditorOpen(false);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save event.";
      setEventError(message);
      setMediaError(message);
    } finally {
      setIsSavingEvent(false);
      setIsSavingMedia(false);
    }
  }

  function handleEditEvent(record: EventRecord) {
    setEditingEventId(record.id);
    setEventForm({
      title: record.title,
      description: record.description,
      timelineYear: String(record.timeline_year),
    });
    setActiveEventId(record.id);
    setIsEditorOpen(true);
  }

  function openCreateEventModal() {
    setEditingEventId(null);
    setEditingMediaId(null);
    setEventForm(emptyEventForm);
    setMediaForm(emptyMediaForm);
    setEventError("");
    setMediaError("");
    setIsEditorOpen(true);
  }

  async function handleDeleteEvent(id: number) {
    setDeletingEventId(id);
    setEventError("");

    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const result = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(result.error ?? "Could not delete event.");
      }

      const nextRecords = eventRecords.filter((record) => record.id !== id);
      setEventRecords(nextRecords);
      setActiveEventId(nextRecords[0]?.id ?? "beautiful-union");
      if (editingEventId === id) {
        setEditingEventId(null);
        setEventForm(emptyEventForm);
      }
    } catch (error) {
      setEventError(
        error instanceof Error ? error.message : "Could not delete event.",
      );
    } finally {
      setDeletingEventId(null);
    }
  }

  function handleEditMedia(media: MediaRecord) {
    setEditingMediaId(media.id);
    if (activeEventRecord) {
      setEditingEventId(activeEventRecord.id);
      setEventForm({
        title: activeEventRecord.title,
        description: activeEventRecord.description,
        timelineYear: String(activeEventRecord.timeline_year),
      });
    }
    setMediaForm({
      fileName: media.file_name,
      fileUrl: media.file_url,
      fileType: media.file_type === "video" ? "video" : "image",
    });
    setIsEditorOpen(true);
  }

  async function handleDeleteMedia(id: number) {
    setDeletingId(id);
    setMediaError("");

    try {
      const response = await fetch(`/api/media/${id}`, { method: "DELETE" });
      const result = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(result.error ?? "Could not delete media.");
      }

      setEventRecords((records) =>
        records.map((record) => ({
          ...record,
          media: record.media.filter((media) => media.id !== id),
        })),
      );
      if (editingMediaId === id) {
        setEditingMediaId(null);
        setMediaForm(emptyMediaForm);
      }
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Could not delete media.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function resetMediaForm() {
    setEditingMediaId(null);
    setMediaForm(emptyMediaForm);
    setMediaError("");
  }

  function resetEventForm() {
    setEditingEventId(null);
    setEventForm(emptyEventForm);
    setEventError("");
  }

  async function uploadSelectedFile(file: File) {
    setIsUploadingMedia(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const result = await readJsonResponse<{
        data?: {
          file_name: string;
          file_url: string;
          file_type: "image" | "video";
        };
        error?: string;
      }>(response);
      console.log("Upload response:", result);
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Could not upload media.");
      }

      setMediaForm({
        fileName: result.data.file_name,
        fileUrl: result.data.file_url,
        fileType: result.data.file_type,
      });
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Could not upload media.",
      );
    } finally {
      setIsUploadingMedia(false);
    }
  }

  return (
    <section className="relative flex-1 overflow-y-auto px-4 pb-6 pt-5 sm:px-6 lg:overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&q=80&w=1800')] bg-cover bg-center opacity-28" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(197,160,89,0.16),transparent_26%),linear-gradient(90deg,rgba(17,13,11,0.9),rgba(17,13,11,0.7)_48%,rgba(17,13,11,0.94))]" />

      <div className="relative z-10 flex min-h-full flex-col gap-6 lg:h-full lg:flex-row lg:gap-8">
        <div className="min-w-0 flex-1">
          <div className="mb-7 flex flex-wrap gap-3">
            {timelineFilters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full border px-5 py-2 text-sm transition-all ${isActive ? "border-[#C5A059]/35 bg-[#C5A059] text-[#1B120D] shadow-[0_12px_28px_rgba(197,160,89,0.25)]" : "border-[#C5A059]/20 bg-[#120E0C]/55 text-[#E7D8C0] hover:bg-[#C5A059]/12"}`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <div className="mb-6 flex flex-col gap-4 rounded-[20px] border border-[#C5A059]/16 bg-[#120E0C]/62 px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-lg text-[#F7EAD7]">
                Manage Timeline
              </p>
              <p className="mt-1 text-[11px] text-[#BCA77B]">
                Events come from Supabase. Upload media from your computer in
                the popup.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isLoadingEvents && (
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#BCA77B]">
                  Loading
                </span>
              )}
              <button
                onClick={openCreateEventModal}
                className="rounded-full bg-[#C5A059] px-5 py-2.5 text-sm font-medium text-[#1B120D] transition-colors hover:bg-[#F0D7A2]"
              >
                Add Event
              </button>
            </div>
          </div>

          <div className="relative grid h-auto grid-cols-[86px_minmax(0,1fr)] gap-4 overflow-y-visible pr-0 sm:grid-cols-[160px_70px_minmax(0,1fr)] lg:h-[calc(100%-168px)] lg:grid-cols-[220px_90px_minmax(260px,1fr)] lg:gap-6 lg:overflow-y-auto lg:pr-2">
            <div className="absolute top-0 bottom-0 hidden w-px bg-gradient-to-b from-transparent via-[#C5A059]/60 to-transparent sm:left-[194px] sm:block lg:left-[264px]" />

            {visibleEvents.map((event) => {
              const Icon = event.icon;
              const isActive = activeEvent.id === event.id;
              const editableEventId =
                typeof event.id === "number" ? event.id : null;
              return (
                <React.Fragment key={event.id}>
                  <button
                    onClick={() => setActiveEventId(event.id)}
                    className={`group h-28 overflow-hidden rounded-[14px] border text-left shadow-[0_14px_36px_rgba(0,0,0,0.3)] transition-all sm:h-32 ${isActive ? "border-[#F0D7A2]/70 ring-2 ring-[#F0D7A2]/12" : "border-[#C5A059]/16 hover:border-[#C5A059]/45"}`}
                  >
                    <MediaFrame media={event.media} className="h-full w-full" />
                  </button>

                  <div className="relative hidden h-32 items-center justify-center sm:flex">
                    <button
                      onClick={() => setActiveEventId(event.id)}
                      className={`relative z-10 flex h-[58px] w-[58px] items-center justify-center rounded-full border bg-[#140F0C] transition-all ${isActive ? "border-[#F0D7A2] text-[#F0D7A2] shadow-[0_0_30px_rgba(240,215,162,0.42)]" : "border-[#C5A059]/55 text-[#D4AF37] hover:border-[#F0D7A2]/80"}`}
                      aria-label={`Open ${event.title}`}
                    >
                      <Icon className="h-6 w-6" />
                    </button>
                  </div>

                  <div
                    onClick={() => setActiveEventId(event.id)}
                    className={`min-h-28 cursor-pointer rounded-[18px] border px-4 py-4 text-left transition-all sm:h-32 sm:px-6 ${isActive ? "border-[#C5A059]/30 bg-[#120E0C]/64 shadow-[0_20px_50px_rgba(0,0,0,0.32)]" : "border-transparent bg-transparent hover:bg-[#120E0C]/38"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-serif text-[24px] leading-none text-[#F0D7A2] sm:text-[28px]">
                          {event.year}
                        </p>
                        <h3 className="mt-2 font-serif text-lg text-[#F7EAD7] sm:text-xl">
                          {event.title}
                        </h3>
                      </div>
                      {editableEventId !== null && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              const record = eventRecords.find(
                                (item) => item.id === editableEventId,
                              );
                              if (record) {
                                handleEditEvent(record);
                              }
                            }}
                            className="rounded-full border border-[#C5A059]/25 px-3 py-1 text-[11px] text-[#F0D7A2] transition-colors hover:bg-[#C5A059]/12"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              void handleDeleteEvent(editableEventId);
                            }}
                            disabled={deletingEventId === editableEventId}
                            className="rounded-full border border-red-300/20 px-3 py-1 text-[11px] text-red-100 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            {deletingEventId === editableEventId
                              ? "Deleting"
                              : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 max-w-md text-[12px] leading-5 text-[#D8C8AF] sm:text-[13px] sm:leading-6">
                      {event.summary}
                    </p>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <TimelinePanel
          activeEvent={activeEvent}
          mediaRecords={activeMediaRecords}
          onEditMedia={handleEditMedia}
          onDeleteMedia={handleDeleteMedia}
          deletingId={deletingId}
        />
      </div>

      {isEditorOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/62 px-6 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEventEditor}
            className="w-full max-w-[620px] rounded-[24px] border border-[#C5A059]/24 bg-[#130F0C] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.72)]"
          >
            <div className="mb-5 flex items-start justify-between gap-5">
              <div>
                <p className="font-serif text-2xl text-[#F7EAD7]">
                  {editingEventId
                    ? "Update Timeline Event"
                    : "Create Timeline Event"}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-[#BCA77B]">
                  Choose a photo or video from your computer. The app uploads it
                  to Supabase Storage and links it to this event.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditorOpen(false);
                  resetEventForm();
                  resetMediaForm();
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C5A059]/18 text-[#E7D8C0] transition-colors hover:bg-white/5"
                aria-label="Close editor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px]">
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#BCA77B]">
                    Title
                  </span>
                  <input
                    value={eventForm.title}
                    onChange={(event) =>
                      setEventForm((form) => ({
                        ...form,
                        title: event.target.value,
                      }))
                    }
                    required
                    className="min-w-0 rounded-full border border-[#C5A059]/18 bg-black/24 px-4 py-3 text-sm text-[#F7EAD7] outline-none placeholder:text-[#BCA77B]/70 focus:border-[#C5A059]/55"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#BCA77B]">
                    Year
                  </span>
                  <input
                    value={eventForm.timelineYear}
                    onChange={(event) =>
                      setEventForm((form) => ({
                        ...form,
                        timelineYear: event.target.value,
                      }))
                    }
                    required
                    type="number"
                    className="rounded-full border border-[#C5A059]/18 bg-black/24 px-4 py-3 text-sm text-[#F7EAD7] outline-none placeholder:text-[#BCA77B]/70 focus:border-[#C5A059]/55"
                  />
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#BCA77B]">
                  Description
                </span>
                <textarea
                  value={eventForm.description}
                  onChange={(event) =>
                    setEventForm((form) => ({
                      ...form,
                      description: event.target.value,
                    }))
                  }
                  required
                  rows={3}
                  className="min-w-0 resize-none rounded-[18px] border border-[#C5A059]/18 bg-black/24 px-4 py-3 text-sm text-[#F7EAD7] outline-none placeholder:text-[#BCA77B]/70 focus:border-[#C5A059]/55"
                />
              </label>

              <label className="grid cursor-pointer gap-2 rounded-[18px] border border-dashed border-[#C5A059]/32 bg-black/20 px-4 py-5 text-center transition-colors hover:bg-[#C5A059]/8">
                <span className="text-sm font-medium text-[#F7EAD7]">
                  {isUploadingMedia ? "Uploading..." : "Choose image or video"}
                </span>
                <span className="text-[12px] text-[#BCA77B]">
                  {mediaForm.fileName
                    ? mediaForm.fileName
                    : "Select a file from your folder"}
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="sr-only"
                  disabled={isUploadingMedia}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadSelectedFile(file);
                    }
                  }}
                />
              </label>

              {(eventError || mediaError) && (
                <p className="rounded-[12px] border border-red-300/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-100">
                  {eventError || mediaError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditorOpen(false);
                    resetEventForm();
                    resetMediaForm();
                  }}
                  className="rounded-full border border-[#C5A059]/20 px-5 py-2.5 text-sm text-[#E7D8C0] transition-colors hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEvent || isSavingMedia || isUploadingMedia}
                  className="rounded-full bg-[#C5A059] px-6 py-2.5 text-sm font-medium text-[#1B120D] transition-colors hover:bg-[#F0D7A2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingEvent || isSavingMedia ? "Saving" : "Save Event"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center overflow-hidden rounded-full border border-[#C5A059]/16 bg-[#2A2017]/70 backdrop-blur-md shadow-[0_18px_40px_rgba(0,0,0,0.38)]">
        <button className="flex h-10 w-14 items-center justify-center text-[#E9D7B3] transition-colors hover:bg-white/5">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button className="mx-1 my-1 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0D7A2] text-[#1C140F] shadow-[0_0_0_4px_rgba(197,160,89,0.12),0_10px_20px_rgba(0,0,0,0.25)]">
          <ChevronUp className="h-7 w-7" />
        </button>
        <button className="flex h-10 w-14 items-center justify-center text-[#E9D7B3] transition-colors hover:bg-white/5">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

export default function MuseumPage() {
  const [activeNav, setActiveNav] = useState("home");
  const isTimeline = activeNav === "timeline";

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Playfair+Display:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto bg-[var(--museum-base)] text-[var(--museum-text)] md:flex-row md:overflow-hidden">
      <aside className="flex w-full shrink-0 flex-col justify-between border-b border-[#C5A059]/10 bg-[var(--museum-sidebar)] px-4 py-4 shadow-[0_0_40px_rgba(0,0,0,0.35)] sm:px-5 md:w-[220px] md:border-b-0 md:border-r md:py-6 lg:w-[250px] xl:w-[290px]">
        <div className="space-y-7">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <TreeLogo />
              <div>
                <h1 className="font-serif text-[28px] leading-none tracking-[0.14em] text-[#F4E5C9]">
                  ROOTS
                </h1>
                <p className="font-serif text-[12px] tracking-[0.22em] uppercase text-[#D7BE8A] mt-1">
                  Your family. Your legacy.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-full bg-white/5 px-2 py-2 w-fit">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=160"
                alt="Aarav Sharma"
                className="w-10 h-10 rounded-full object-cover border border-[#C5A059]/25"
              />
              <div>
                <p className="text-[11px] text-[#DCCCB1]">Welcome back,</p>
                <div className="flex items-center gap-2 text-sm text-[#F6EBDD]">
                  <span className="font-medium">Aarav Sharma</span>
                  <ChevronRight className="w-3.5 h-3.5 rotate-90 text-[#DCCCB1]" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#C5A059] mb-3">
              Discover
            </p>
            <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:block md:space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveNav(item.key)}
                    className={`w-full flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm tracking-wide transition-all border ${isActive ? "bg-[#9A7B42]/28 border-[#C5A059]/25 text-[#F5EBD2] shadow-[0_10px_30px_rgba(197,160,89,0.16)]" : "bg-transparent border-transparent text-[#D8C8AF] hover:bg-white/5 hover:border-white/5"}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isActive ? "text-[#D4AF37]" : "text-[#D8C8AF]"}`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden rounded-[18px] border border-[#C5A059]/20 bg-[#0F0B09] px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] lg:block">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full border border-[#C5A059]/40 p-2 text-[#D4AF37] bg-[#C5A059]/10">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C5A059] mb-1">
                  Legacy Guardian
                </p>
                <p className="text-[11px] leading-5 text-[#D8C8AF]">
                  AI is watching over your family heritage
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden space-y-4 md:block">
          <div className="rounded-[18px] overflow-hidden border border-[#C5A059]/20 bg-[#181410] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="h-32 rounded-[14px] border border-dashed border-[#C5A059]/45 relative overflow-hidden bg-[#0F0B09]">
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 50%, rgba(197,160,89,0.35), transparent 14%), radial-gradient(circle at 20% 30%, rgba(197,160,89,0.18), transparent 4%), radial-gradient(circle at 78% 24%, rgba(197,160,89,0.18), transparent 4%), linear-gradient(90deg, transparent 0 20%, rgba(197,160,89,0.45) 20% 20.5%, transparent 20.5% 39%, rgba(197,160,89,0.45) 39% 39.5%, transparent 39.5% 60%, rgba(197,160,89,0.45) 60% 60.5%, transparent 60.5% 80%, rgba(197,160,89,0.45) 80% 80.5%, transparent 80.5% 100%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#FFF2D4] shadow-[0_0_24px_rgba(255,242,212,0.95)]" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[#D7BE8A]">
              <div>
                <p className="text-sm font-serif">Hall of Memories</p>
                <p className="text-[11px] mt-1 text-[#9E8C69]">
                  Section 1 of 8
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#C5A059]" />
            </div>
          </div>
        </div>
      </aside>

      <main className="relative min-h-[calc(100vh-236px)] flex-1 overflow-visible bg-[#110D0B] md:min-h-screen md:min-w-0 md:overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,242,212,0.08),transparent_24%),linear-gradient(180deg,rgba(17,13,11,0.4),rgba(17,13,11,0.86))]" />

        <div className="relative z-10 h-full flex flex-col">
          <header className="flex flex-col gap-5 px-4 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
            <div className="max-w-xl pt-2">
              <p className="font-serif text-[30px] leading-none text-[#F7EAD7]">
                {isTimeline ? "Timeline" : "Hall of Memories"}
              </p>
              <p className="mt-2 text-sm text-[#E7D8C0] max-w-md leading-6">
                {isTimeline
                  ? "Journey through generations and cherished moments."
                  : "Walk through your family's precious moments."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[#E7D8C0]">
              <button className="h-11 rounded-full border border-[#C5A059]/25 bg-[#1A140F]/60 px-5 text-sm flex items-center gap-2 hover:bg-[#1F1913] transition-colors">
                <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                <span className="hidden sm:inline">Invite Family</span>
              </button>
              <button className="w-11 h-11 rounded-full border border-[#C5A059]/20 bg-[#1A140F]/50 flex items-center justify-center hover:bg-[#201911] transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <button className="w-11 h-11 rounded-full border border-[#C5A059]/20 bg-[#1A140F]/50 flex items-center justify-center hover:bg-[#201911] transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=160"
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-[#C5A059]/25"
              />
            </div>
          </header>

          {isTimeline ? (
            <TimelineView />
          ) : (
            <section className="relative min-h-[720px] flex-1 px-4 pb-6 pt-5 sm:min-h-[760px] sm:px-6 md:min-h-0">
              <div className="relative h-full overflow-hidden rounded-[24px] border border-[#C5A059]/10 bg-[#120E0C] shadow-[0_40px_80px_rgba(0,0,0,0.5)] sm:rounded-[32px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,242,212,0.08),transparent_18%),radial-gradient(circle_at_50%_80%,rgba(197,160,89,0.14),transparent_24%),linear-gradient(180deg,rgba(12,8,6,0.92),rgba(17,13,11,0.78))]" />

                <div className="absolute inset-0 z-10">
                  <ThreeDVirtualMuseum className="w-full h-full" />
                </div>

                <div className="absolute inset-0 z-20 px-4 py-5 pointer-events-none sm:px-8 sm:py-8">
                  <div className="absolute left-5 top-6 max-w-[260px] pointer-events-auto sm:left-[10%] sm:top-[16%] sm:max-w-[350px]">
                    <div className="text-[#F4E5C9] font-serif text-2xl leading-[1.1] sm:text-3xl">
                      Hall of Memories
                    </div>
                    <p className="mt-2 text-sm text-[#F6EBDD]/90 max-w-[220px] leading-6">
                      Walk through your family&apos;s precious moments.
                    </p>
                  </div>

                  {markers.map((marker, index) => (
                    <div
                      key={index}
                      className="absolute flex h-12 w-12 items-center justify-center rounded-full border border-[#FFF2D4]/90 shadow-[0_0_30px_rgba(255,242,212,0.55)] sm:h-16 sm:w-16 md:h-20 md:w-20 xl:h-24 xl:w-24"
                      style={{ left: marker.left, top: marker.top }}
                    >
                      <ChevronUp className="h-5 w-5 text-[#FFF2D4] sm:h-7 sm:w-7 xl:h-9 xl:w-9" />
                    </div>
                  ))}

                  <div className="absolute left-1/2 top-[22%] h-[400px] w-[78vw] max-w-[300px] -translate-x-1/2 sm:h-[470px] sm:w-[340px] sm:max-w-none lg:left-auto lg:right-[5%] lg:top-[15%] lg:h-[470px] lg:w-[330px] lg:translate-x-0 xl:right-[6%] xl:h-[560px] xl:w-[430px]">
                    <div className="absolute inset-0 rounded-t-[10px] rounded-b-[6px] border border-[#C5A059]/22 bg-[#110D0B]/5 backdrop-blur-[1px] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_25px_80px_rgba(0,0,0,0.35)]" />
                    <div className="absolute inset-x-[14px] top-[14px] bottom-[110px] rounded-[6px] overflow-hidden border border-white/5 bg-[#1b1410]">
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent_18%,transparent_82%,rgba(0,0,0,0.2))]" />
                      <div className="absolute inset-x-[16px] top-6 h-10 bg-[radial-gradient(circle_at_top,rgba(255,242,212,0.98),rgba(255,242,212,0.28),transparent_70%)] blur-[1px]" />
                      <div className="absolute inset-x-[46px] top-[78px] bottom-[26px] flex items-center justify-center">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img
                            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1100"
                            alt="Wedding portrait"
                            className="max-h-full max-w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] rotate-[-1deg]"
                          />
                          <div className="absolute bottom-[-6px] left-1/2 h-[14px] w-28 -translate-x-1/2 rounded-[50%] bg-[#5B4330] blur-[1px]" />
                          <div className="absolute left-1/2 top-[72%] h-28 w-3 -translate-x-1/2 bg-[#674D37] rounded-sm rotate-[-3deg] shadow-[0_8px_14px_rgba(0,0,0,0.3)]" />
                          <div className="absolute left-1/2 top-[57%] w-48 h-48 -translate-x-1/2 -translate-y-1/2 border border-[#C5A059]/18 rounded-sm rotate-[-4deg] shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-[128px] rounded-b-[6px] bg-[#1b120e] border border-[#201812] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] flex items-end">
                      <div className="w-full px-5 pb-5 text-[#E7D8C0]">
                        <div className="font-serif text-[28px] leading-none">
                          Meera &amp; Ramesh
                        </div>
                        <div className="mt-2 text-[13px] text-[#D8C8AF]">
                          Wedding Day, 1984
                        </div>
                        <div className="mt-1 text-[12px] text-[#BCA77B]">
                          A beautiful beginning...
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[11px] text-[#BCA77B] uppercase tracking-[0.2em]">
                            All Restored Photo
                          </span>
                          <div className="w-6 h-6 rounded-full border border-[#C5A059]/60 text-[#C5A059] flex items-center justify-center text-[11px]">
                            i
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-5 bottom-24 w-[240px] rounded-[18px] border border-[#C5A059]/12 bg-black/40 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:left-8 sm:bottom-8 sm:w-[280px]">
                    <div className="h-24 rounded-[14px] bg-[#0F0B09] border border-[#C5A059]/30 relative overflow-hidden">
                      <div className="absolute inset-3 border border-dashed border-[#C5A059]/60 rounded-[10px]" />
                      <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFF2D4] shadow-[0_0_18px_rgba(255,242,212,0.8)]" />
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-4 text-[#E7D8C0]">
                      <div>
                        <div className="text-sm font-serif text-[#F4E5C9]">
                          You are here
                        </div>
                        <div className="text-[12px] mt-1 text-[#D8C8AF]">
                          Hall of Memories
                        </div>
                        <div className="text-[11px] mt-0.5 text-[#BCA77B]">
                          Section 1 of 8
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C5A059] mt-1" />
                    </div>
                  </div>

                  <div className="absolute left-1/2 bottom-5 flex -translate-x-1/2 items-center gap-0 overflow-hidden rounded-full border border-[#C5A059]/14 bg-[#2A2017]/70 shadow-[0_18px_40px_rgba(0,0,0,0.38)] backdrop-blur-md sm:bottom-6">
                    <button className="w-14 h-10 flex items-center justify-center text-[#E9D7B3] hover:bg-white/5 transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="w-16 h-16 mx-1 my-1 rounded-full bg-[#F0D7A2] flex items-center justify-center shadow-[0_0_0_4px_rgba(197,160,89,0.12),0_10px_20px_rgba(0,0,0,0.25)] text-[#1C140F]">
                      <ChevronUp className="w-7 h-7" />
                    </button>
                    <button className="w-14 h-10 flex items-center justify-center text-[#E9D7B3] hover:bg-white/5 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-3 text-[#D8C8AF] lg:flex">
                    <button className="w-11 h-11 rounded-full border border-[#C5A059]/18 bg-[#1A140F]/55 flex items-center justify-center hover:bg-[#201912] transition-colors">
                      <X className="w-4 h-4 rotate-45" />
                    </button>
                    <button className="w-11 h-11 rounded-full border border-[#C5A059]/18 bg-[#1A140F]/55 flex items-center justify-center hover:bg-[#201912] transition-colors">
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button className="w-11 h-11 rounded-full border border-[#C5A059]/18 bg-[#1A140F]/55 flex items-center justify-center hover:bg-[#201912] transition-colors">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
