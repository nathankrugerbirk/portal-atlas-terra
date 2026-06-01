// ─── Tipos de usuário e perfil ──────────────────────────────────────────────

export type UserRole = "admin" | "client";

export interface Profile {
  id: string;
  auth_user_id: string;
  name: string;
  username: string;
  role: UserRole;
  status: "active" | "inactive";
  created_at: string;
}

// ─── Cliente ─────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  profile_id: string;
  name: string;
  notes: string | null;
  created_at: string;
  // joined
  profile?: Profile;
}

// ─── Fazenda ─────────────────────────────────────────────────────────────────

export interface Farm {
  id: string;
  client_id: string;
  name: string;
  city: string;
  state: string;
  total_area_ha: number;
  total_area_alq: number;
  cover_image_path: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  // joined
  client?: Client;
  cover_image_url?: string | null;
}

// ─── Modelos 3D / 2D ─────────────────────────────────────────────────────────

export type FarmModelType = "3d" | "2d";

export interface FarmModel {
  id: string;
  farm_id: string;
  type: FarmModelType;
  title: string | null;
  cesium_url: string;
  created_at: string;
  updated_at: string;
}

// ─── Quadro de áreas ─────────────────────────────────────────────────────────

export interface AreaTableRow {
  id: string;
  farm_id: string;
  class_name: string;
  area_ha: number;
  area_alq: number;
  percentage: number;
  sort_order: number;
  created_at: string;
}

// ─── Documentação: números ────────────────────────────────────────────────────

export type DocumentType = "matricula" | "ccir" | "cib" | "sigef" | "car";

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  matricula: "Matrícula",
  ccir: "CCIR",
  cib: "CIB",
  sigef: "SIGEF",
  car: "CAR",
};

export interface PropertyDocumentNumber {
  id: string;
  farm_id: string;
  document_type: DocumentType;
  document_number: string;
  created_at: string;
  updated_at: string;
}

// ─── Documentação: arquivos ───────────────────────────────────────────────────

export interface PropertyDocumentFile {
  id: string;
  farm_id: string;
  title: string;
  document_type: string;
  file_path: string;
  created_at: string;
  // gerado dinamicamente
  signed_url?: string;
}

// ─── Imagens da fazenda ───────────────────────────────────────────────────────

export interface FarmImage {
  id: string;
  farm_id: string;
  file_path: string;
  sort_order: number;
  created_at: string;
  // gerado dinamicamente
  signed_url?: string;
}

// ─── Vídeos ───────────────────────────────────────────────────────────────────

export type VideoProvider = "youtube" | "vimeo" | "other";

export interface FarmVideo {
  id: string;
  farm_id: string;
  title: string;
  video_url: string;
  video_provider: VideoProvider;
  sort_order: number;
  created_at: string;
}

// ─── PDFs técnicos ────────────────────────────────────────────────────────────

export type PdfCategory = "mapa" | "relatorio";

export interface TechnicalPdf {
  id: string;
  farm_id: string;
  title: string;
  category: PdfCategory;
  file_path: string;
  sort_order: number;
  created_at: string;
  // gerado dinamicamente
  signed_url?: string;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = void> {
  data?: T;
  error?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_clients: number;
  total_farms: number;
  recent_farms: Farm[];
}
