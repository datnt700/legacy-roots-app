import { getSupabaseProjectUrl, getSupabaseStorageBucket } from "@/lib/supabase";
import type { getSupabase } from "@/lib/supabase";
import type { MediaRow } from "@/features/media/types";

export function getStoragePathFromUrl(fileUrl: string) {
  const bucket = getSupabaseStorageBucket();

  try {
    const url = new URL(fileUrl);
    const projectUrl = new URL(getSupabaseProjectUrl());

    if (url.host !== projectUrl.host) {
      return null;
    }

    const marker = `/storage/v1/object/public/${bucket}/`;
    const signedMarker = `/storage/v1/object/sign/${bucket}/`;
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.includes(marker)) {
      return pathname.split(marker)[1];
    }

    if (pathname.includes(signedMarker)) {
      return pathname.split(signedMarker)[1];
    }
  } catch {
    return null;
  }

  return null;
}

export async function withDisplayUrl(
  supabase: ReturnType<typeof getSupabase>,
  media: MediaRow,
) {
  const bucket = getSupabaseStorageBucket();
  const path = getStoragePathFromUrl(media.file_url);

  if (!path) {
    return media;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    return media;
  }

  return {
    ...media,
    file_url: data.signedUrl,
  };
}
