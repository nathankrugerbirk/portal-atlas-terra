import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: clientCount },
    { count: farmCount },
    { data: farmsArea },
    { data: recentFarms },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("farms").select("*", { count: "exact", head: true }),
    supabase.from("farms").select("total_area_ha"),
    supabase
      .from("farms")
      .select("id, name, city, state, created_at, clients(profiles(name))")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalAreaHa = (farmsArea ?? []).reduce(
    (sum: number, f: any) => sum + (f.total_area_ha || 0),
    0
  );
  const formattedArea = totalAreaHa.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-orbitron font-bold text-2xl mb-1" style={{ color: "#F6F8FA" }}>
          Dashboard
        </h1>
        <p className="font-montserrat text-sm" style={{ color: "#8B949E" }}>
          Visão geral da plataforma Atlas Terra
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total de Clientes"
          value={clientCount ?? 0}
          accent="cyan"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
        />
        <StatCard
          label="Total de Fazendas"
          value={farmCount ?? 0}
          accent="cyan"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="3 11 12 2 21 11"/>
              <path d="M5 11v8a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-8"/>
            </svg>
          }
        />
        <StatCard
          label="Área Monitorada (ha)"
          value={formattedArea}
          accent="cyan"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h18v18H3z" rx="1"/>
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
              <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3"/>
            </svg>
          }
        />
      </div>

      {/* Atalhos rápidos */}
      <div className="mb-8">
        <h2 className="font-orbitron font-semibold text-sm mb-4 uppercase tracking-widest" style={{ color: "#00E6FF" }}>
          Ações Rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/clients/new" className="btn-atlas-primary">
            + Novo Cliente
          </Link>
          <Link href="/admin/farms/new" className="btn-atlas-primary">
            + Nova Fazenda
          </Link>
        </div>
      </div>

      {/* Últimas fazendas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-orbitron font-semibold text-sm uppercase tracking-widest" style={{ color: "#00E6FF" }}>
            Últimas Fazendas Cadastradas
          </h2>
          <Link
            href="/admin/farms"
            className="font-montserrat text-xs hover:opacity-80 transition-opacity"
            style={{ color: "#00E6FF" }}
          >
            Ver todas →
          </Link>
        </div>

        {recentFarms && recentFarms.length > 0 ? (
          <div className="atlas-card overflow-hidden">
            <div className="table-wrap">
              <table className="atlas-table">
                <thead>
                  <tr>
                    <th>Nome da Fazenda</th>
                    <th>Cliente</th>
                    <th>Localização</th>
                    <th>Cadastro</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentFarms.map((farm: any) => (
                    <tr key={farm.id}>
                      <td className="font-semibold" style={{ color: "#F6F8FA" }}>
                        {farm.name}
                      </td>
                      <td style={{ color: "#8B949E" }}>
                        {(farm.clients as any)?.profiles?.name ?? "—"}
                      </td>
                      <td style={{ color: "#8B949E" }}>
                        {farm.city}, {farm.state}
                      </td>
                      <td style={{ color: "#8B949E" }}>{formatDate(farm.created_at)}</td>
                      <td>
                        <Link
                          href={`/admin/farms/${farm.id}`}
                          className="font-montserrat text-xs"
                          style={{ color: "#00E6FF" }}
                        >
                          Gerenciar →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            className="atlas-card p-8 text-center font-montserrat text-sm"
            style={{ color: "#8B949E" }}
          >
            Nenhuma fazenda cadastrada ainda.{" "}
            <Link href="/admin/farms/new" style={{ color: "#00E6FF" }}>
              Criar primeira fazenda
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
