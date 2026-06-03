import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SharePage from "./SharePage";

// Admin client server-side — sem auth de usuário
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getFarm(id: string) {
  const sb = adminClient();
  const { data } = await sb.from("farms").select("*").eq("id", id).single();
  return data;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const farm = await getFarm(params.id);
  if (!farm) return { title: "Fazenda não encontrada" };

  const sb = adminClient();
  let ogImage: string | undefined;
  if (farm.cover_image_path) {
    const { data } = await sb.storage.from("farm-images").createSignedUrl(farm.cover_image_path, 3600);
    ogImage = data?.signedUrl ?? undefined;
  }

  const desc = `${farm.city}, ${farm.state} — ${Number(farm.total_area_ha).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`;

  return {
    title: farm.name,
    description: desc,
    openGraph: {
      title: farm.name,
      description: desc,
      images: ogImage ? [{ url: ogImage }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: farm.name,
      description: desc,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function ShareFarmPage({ params }: { params: { id: string } }) {
  const farm = await getFarm(params.id);
  if (!farm) notFound();

  // Página desativada
  if (!farm.share_enabled) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0D1117",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Exo 2', sans-serif", padding: "24px",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&display=swap" rel="stylesheet"/>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
          <h1 style={{ color: "#F6F8FA", fontSize: "1.4rem", fontWeight: 700, marginBottom: 12 }}>
            Link não disponível
          </h1>
          <p style={{ color: "#8B949E", fontSize: "0.9rem", lineHeight: 1.6 }}>
            O compartilhamento desta propriedade está desativado no momento.
          </p>
        </div>
      </div>
    );
  }

  const sb = adminClient();

  // Capa
  let coverUrl: string | null = null;
  if (farm.cover_image_path) {
    const { data } = await sb.storage.from("farm-images").createSignedUrl(farm.cover_image_path, 3600);
    coverUrl = data?.signedUrl ?? null;
  }

  // Imagens
  const { data: rawImages } = await sb
    .from("farm_images").select("*").eq("farm_id", farm.id).order("created_at");

  const images = await Promise.all(
    (rawImages || []).map(async (img: any) => {
      const { data } = await sb.storage.from("farm-images").createSignedUrl(img.file_path, 3600);
      return { id: img.id, title: img.title, url: data?.signedUrl ?? null };
    })
  );
  const validImages = images.filter((i): i is { id: any; title: any; url: string } => i.url !== null);

  // Vídeos
  const { data: videos } = await sb
    .from("farm_videos").select("*").eq("farm_id", farm.id).order("created_at");

  // Quadro de áreas
  const { data: areaRows } = await sb
    .from("area_table_rows").select("*").eq("farm_id", farm.id).order("sort_order");

  return (
    <SharePage
      farm={farm}
      coverUrl={coverUrl}
      images={validImages}
      videos={videos || []}
      areaRows={areaRows || []}
    />
  );
}
