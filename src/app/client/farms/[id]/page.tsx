import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { FarmDetailClient } from "./FarmDetailClient";

export default async function FarmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: farm } = await supabase
    .from("farms").select("*").eq("id", id).single();

  if (!farm) notFound();

  const [
    { data: models },
    { data: areaRows },
    { data: docNumbers },
    { data: docFiles },
    { data: images },
    { data: videos },
    { data: pdfs },
  ] = await Promise.all([
    supabase.from("farm_models").select("*").eq("farm_id", id),
    supabase.from("area_table_rows").select("*").eq("farm_id", id).order("sort_order"),
    supabase.from("property_document_numbers").select("*").eq("farm_id", id),
    supabase.from("property_document_files").select("*").eq("farm_id", id),
    supabase.from("farm_images").select("*").eq("farm_id", id).order("sort_order"),
    supabase.from("farm_videos").select("*").eq("farm_id", id).order("sort_order"),
    supabase.from("technical_pdfs").select("*").eq("farm_id", id).order("sort_order"),
  ]);

  return (
    <FarmDetailClient
      farm={farm}
      models={models ?? []}
      areaRows={areaRows ?? []}
      docNumbers={docNumbers ?? []}
      docFiles={docFiles ?? []}
      images={images ?? []}
      videos={videos ?? []}
      pdfs={pdfs ?? []}
    />
  );
}
