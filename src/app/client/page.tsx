import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatHa } from "@/lib/utils";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, id")
    .eq("auth_user_id", user!.id)
    .single();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", profile!.id)
    .single();

  const { data: farms } = await supabase
    .from("farms")
    .select("*")
    .eq("client_id", client?.id ?? "")
    .order("name");

  // Buscar URLs assinadas das capas no servidor (seguro, usa service_role via server client)
  const farmsWithCovers = await Promise.all(
    (farms ?? []).map(async (farm) => {
      let coverUrl: string | null = null;
      if (farm.cover_image_path) {
        const { data } = await supabase.storage
          .from("farm-images")
          .createSignedUrl(farm.cover_image_path, 3600);
        coverUrl = data?.signedUrl ?? null;
      }
      return { ...farm, coverUrl };
    })
  );

  return (
    <div className="animate-fade-in">
      {/* Saudação */}
      <div className="mb-10">
        <h1
          className="font-orbitron font-bold text-3xl mb-2"
          style={{ color: "#FFFFFF" }}
        >
          Olá, {profile?.name?.split(" ")[0] ?? "Bem-vindo"}.
        </h1>
        <p className="font-montserrat text-base" style={{ color: "#6B7280" }}>
          Selecione uma fazenda para visualizar os materiais técnicos disponíveis.
        </p>
      </div>

      {/* Cards das fazendas */}
      {farmsWithCovers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {farmsWithCovers.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      ) : (
        <div className="atlas-card p-16 text-center" style={{ maxWidth: "480px" }}>
          <svg
            width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5"
            className="mx-auto mb-4 opacity-20"
            style={{ color: "#00C8D9" }}
          >
            <polygon points="3 11 12 2 21 11"/>
            <path d="M5 11v8a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-8"/>
          </svg>
          <p className="font-montserrat text-sm" style={{ color: "#6B7280" }}>
            Nenhuma fazenda disponível no momento.
          </p>
          <p className="font-montserrat text-xs mt-1" style={{ color: "rgba(107,114,128,0.5)" }}>
            Entre em contato com a Atlas Terra para mais informações.
          </p>
        </div>
      )}
    </div>
  );
}

function FarmCard({ farm }: { farm: any }) {
  return (
    <Link href={`/client/farms/${farm.id}`} className="block group">
      <div
        className="overflow-hidden transition-all duration-300 cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #111820 0%, #0A1A26 100%)",
          border: "1px solid rgba(0,200,217,0.15)",
          borderRadius: "8px",
        }}
      >
        {/* Capa */}
        <div
          className="relative overflow-hidden"
          style={{ height: "180px", background: "#060E18" }}
        >
          {farm.coverUrl ? (
            <>
              {/* Foto real */}
              <img
                src={farm.coverUrl}
                alt={farm.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradiente escuro na base */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(6,14,24,0.85) 0%, rgba(6,14,24,0.1) 50%, transparent 100%)",
                }}
              />
            </>
          ) : (
            <>
              {/* Placeholder decorativo */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, #0A1A26 0%, #111820 100%)",
                }}
              />
              <svg
                viewBox="0 0 200 120"
                className="absolute inset-0 w-full h-full"
                style={{ opacity: 0.08 }}
                preserveAspectRatio="xMidYMid slice"
              >
                <ellipse cx="100" cy="60" rx="90" ry="50" fill="none" stroke="#00C8D9" strokeWidth="0.8"/>
                <ellipse cx="100" cy="60" rx="70" ry="38" fill="none" stroke="#00C8D9" strokeWidth="0.6"/>
                <ellipse cx="100" cy="60" rx="50" ry="26" fill="none" stroke="#00C8D9" strokeWidth="0.5"/>
                <ellipse cx="100" cy="60" rx="30" ry="16" fill="none" stroke="#00C8D9" strokeWidth="0.4"/>
                <circle cx="100" cy="60" r="4" fill="#00C8D9" opacity="0.5"/>
              </svg>
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ color: "rgba(0,200,217,0.3)" }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <polygon points="3 11 12 2 21 11"/>
                  <path d="M5 11v8a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-8"/>
                </svg>
              </div>
            </>
          )}

          {/* Badge de localização no canto superior direito */}
          <div
            className="absolute top-3 right-3 font-montserrat text-xs px-2 py-1 rounded"
            style={{
              background: "rgba(6,14,24,0.8)",
              border: "1px solid rgba(0,200,217,0.2)",
              color: "#6B7280",
              backdropFilter: "blur(4px)",
            }}
          >
            {farm.state}
          </div>
        </div>

        {/* Informações */}
        <div className="p-4">
          <h3
            className="font-orbitron font-bold text-base mb-1 transition-colors duration-200"
            style={{ color: "#FFFFFF" }}
          >
            {farm.name}
          </h3>
          <p className="font-montserrat text-xs mb-3" style={{ color: "#6B7280" }}>
            {farm.city}, {farm.state}
          </p>

          <div className="flex items-center justify-between">
            <span className="font-orbitron font-bold text-sm" style={{ color: "#00E6FF" }}>
              {formatHa(farm.total_area_ha)} ha
            </span>
            <span
              className="font-montserrat text-xs font-semibold flex items-center gap-1 transition-colors duration-200"
              style={{ color: "#00C8D9" }}
            >
              Ver materiais →
            </span>
          </div>

          {/* Linha de separação com glow sutil no hover */}
          <div
            className="mt-3 h-px transition-opacity duration-300"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(0,200,217,0.3), transparent)",
            }}
          />
        </div>
      </div>
    </Link>
  );
}

