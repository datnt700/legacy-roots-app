export type MediaPayload = {
  file_name?: unknown;
  file_url?: unknown;
  file_type?: unknown;
};

export function validateMediaPayload(payload: MediaPayload) {
  const fileName =
    typeof payload.file_name === "string" ? payload.file_name.trim() : "";
  const fileUrl =
    typeof payload.file_url === "string" ? payload.file_url.trim() : "";
  const fileType =
    typeof payload.file_type === "string" ? payload.file_type.trim() : "";

  if (!fileName || !fileUrl || !fileType) {
    return { error: "file_name, file_url and file_type are required." };
  }

  if (!["image", "video"].includes(fileType)) {
    return { error: "file_type must be image or video." };
  }

  return {
    data: {
      file_name: fileName,
      file_url: fileUrl,
      file_type: fileType,
    },
  };
}
