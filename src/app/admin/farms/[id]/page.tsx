import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FarmManagerClient } from "./FarmManagerClient";

export default async function FarmManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: farm },
    { data: models },
    { data: areaRows },
    { data: docNumbers },
    { data: docFiles },
    { data: images },
    { data: videos },
    { data: pdfs },
  ] = await Promise.all([
    supabase.from("farms").select("*, client:clients(name)").eq("id", id).single(),
    supabase.from("farm_models").select("*").eq("farm_id", id),
    supabase.from("area_table_rows").select("*").eq("farm_id", id).order("sort_order"),
    supabase.from("property_document_numbers").select("*").eq("farm_id", id),
    supabase.from("property_document_files").select("*").eq("farm_id", id).order("created_at"),
    supabase.from("farm_images").select("*").eq("farm_id", id).order("sort_order"),
    supabase.from("farm_videos").select("*").eq("farm_id", id).order("sort_order"),
    supabase.from("technical_pdfs").select("*").eq("farm_id", id).order("sort_order"),
  ]);

  if (!farm) notFound();

  return (
    <FarmManagerClient
      farm={farm}
      initialModels={models ?? []}
      initialAreaRows={areaRows ?? []}
      initialDocNumbers={docNumbers ?? []}
      initialDocFiles={docFiles ?? []}
      initialImages={images ?? []}
      initialVideos={videos ?? []}
      initialPdfs={pdfs ?? []}
    />
  );
}
