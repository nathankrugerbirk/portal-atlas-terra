import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatHa } from "@/lib/utils";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("auth_user_id", user!.id)
    .single();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", (
      await supabase.from("profiles").select("id").eq("auth_user_id", user!.id).single()
    ).data!.id)
    .single();

  const { data: farms } = await supabase
    .from("farms")
    .select("*")
    .eq("client_id", client?.id ?? "")
    .order("name");

  return (
    <div className="animate-fade-in">
      {/* Saudação */}
      <div className="mb-10">
        <h1
          className="font-orbitron font-bold text-3xl mb-2 text-glow-cyan"
          style={{ color: "#F2F2F2" }}
        >
          Olá, {profile?.name?.split(" ")[0] ?? "Bem-vindo"}.
        </h1>
        <p className="font-montserrat text-base" style={{ color: "#8BA3B5" }}>
          Selecione uma fazenda para visualizar os materiais técnicos disponíveis.
        </p>
      </div>

      {/* Cards das fazendas */}
      {farms && farms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {farms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      ) : (
        <div
          className="atlas-card p-16 text-center"
          style={{ maxWidth: "480px" }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto mb-4 opacity-20"
            style={{ color: "#00E1FF" }}
          >
            <polygon points="3 11 12 2 21 11" />
            <path d="M5 11v8a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-8" />
          </svg>
          <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
            Nenhuma fazenda disponível no momento.
          </p>
          <p
            className="font-montserrat text-xs mt-1"
            style={{ color: "rgba(139,163,181,0.5)" }}
          >
            Entre em contato com a Atlas Terra para mais informações.
          </p>
        </div>
      )}
    </div>
  );
}

function FarmCard({ farm }: { farm: any }) {
  return (
    <Link href={`/client/farms/${farm.id}`} className="block">
      <div
        className="atlas-card overflow-hidden transition-all duration-300 cursor-pointer"
        style={{ minHeight: "200px" }}
      >
        {/* Imagem de capa ou placeholder */}
        <div
          className="h-40 relative flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #0D1E2C 0%, #122434 100%)",
            borderBottom: "1px solid rgba(0,225,255,0.1)",
          }}
        >
          {/* Padrão decorativo de curvas de nível */}
          <svg
            viewBox="0 0 200 120"
            className="absolute inset-0 w-full h-full opacity-10"
            preserveAspectRatio="xMidYMid slice"
          >
            <ellipse cx="100" cy="60" rx="90" ry="50" fill="none" stroke="#00E1FF" strokeWidth="0.8"/>
            <ellipse cx="100" cy="60" rx="70" ry="38" fill="none" stroke="#00E1FF" strokeWidth="0.6"/>
            <ellipse cx="100" cy="60" rx="50" ry="26" fill="none" stroke="#00E1FF" strokeWidth="0.5"/>
            <ellipse cx="100" cy="60" rx="30" ry="16" fill="none" stroke="#00E1FF" strokeWidth="0.4"/>
            <circle cx="100" cy="60" r="4" fill="#00E1FF" opacity="0.6"/>
          </svg>
          <div
            className="font-orbitron font-bold text-xs tracking-widest uppercase z-10"
            style={{ color: "rgba(0,225,255,0.5)" }}
          >
            Atlas Terra
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3
            className="font-orbitron font-bold text-base mb-1"
            style={{ color: "#F2F2F2" }}
          >
            {farm.name}
          </h3>
          <p
            className="font-montserrat text-xs mb-3"
            style={{ color: "#8BA3B5" }}
          >
            {farm.city}, {farm.state}
          </p>
          <div className="flex items-center justify-between">
            <span
              className="font-montserrat text-sm font-semibold"
              style={{ color: "#FFA23A" }}
            >
              {formatHa(farm.total_area_ha)} ha
            </span>
            <span
              className="font-montserrat text-xs font-600 flex items-center gap-1"
              style={{ color: "#00E1FF" }}
            >
              Ver materiais →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
