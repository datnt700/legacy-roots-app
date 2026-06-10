import { NextResponse } from "next/server";
import { getSupabase, getSupabaseStorageBucket } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();
  return extension ? `.${extension.toLowerCase()}` : "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    const bucket = getSupabaseStorageBucket();
    const supabase = getSupabase();
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    const path = `timeline/${Date.now()}-${safeName || "upload"}${getFileExtension(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error: `Could not upload to bucket "${bucket}": ${uploadError.message}`,
        },
        { status: 500 },
      );
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({
      data: {
        file_name: file.name,
        file_type: file.type.startsWith("video/") ? "video" : "image",
        file_url: data.publicUrl,
        storage_path: path,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not upload media.",
      },
      { status: 500 },
    );
  }
}
