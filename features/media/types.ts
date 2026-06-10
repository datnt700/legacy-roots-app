export type MediaRow = {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  family_id?: string | null;
  entity_type?: "person" | "event" | "family" | null;
  entity_id?: string | null;
  created_at: string | null;
};
