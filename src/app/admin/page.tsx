import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: clientCount },
    { count: farmCount },
    { data: recentFarms },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("farms").select("*", { count: "exact", head: true }),
    supabase
      .from("farms")
      .select("id, name, city, state, created_at, clients(profiles(name))")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-orbitron font-bold text-2xl mb-1" style={{ color: "#F2F2F2" }}>
          Dashboard
        </h1>
        <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
          Visão geral da plataforma Atlas Terra
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
          accent="copper"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="3 11 12 2 21 11"/>
              <path d="M5 11v8a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-8"/>
            </svg>
          }
        />
      </div>

      {/* Atalhos rápidos */}
      <div className="mb-8">
        <h2 className="font-orbitron font-semibold text-sm mb-4 uppercase tracking-widest" style={{ color: "#00E1FF" }}>
          Ações Rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/clients/new" className="btn-atlas-primary">
            + Novo Cliente
          </Link>
          <Link href="/admin/farms/new" className="btn-atlas-copper">
            + Nova Fazenda
          </Link>
        </div>
      </div>

      {/* Últimas fazendas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-orbitron font-semibold text-sm uppercase tracking-widest" style={{ color: "#00E1FF" }}>
            Últimas Fazendas Cadastradas
          </h2>
          <Link
            href="/admin/farms"
            className="font-montserrat text-xs font-600 hover:opacity-80 transition-opacity"
            style={{ color: "#00E1FF" }}
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
                      <td className="font-semibold" style={{ color: "#F2F2F2" }}>
                        {farm.name}
                      </td>
                      <td style={{ color: "#8BA3B5" }}>
                        {(farm.clients as any)?.profiles?.name ?? "—"}
                      </td>
                      <td style={{ color: "#8BA3B5" }}>
                        {farm.city}, {farm.state}
                      </td>
                      <td style={{ color: "#8BA3B5" }}>{formatDate(farm.created_at)}</td>
                      <td>
                        <Link
                          href={`/admin/farms/${farm.id}`}
                          className="font-montserrat text-xs font-600"
                          style={{ color: "#00E1FF" }}
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
            style={{ color: "#8BA3B5" }}
          >
            Nenhuma fazenda cadastrada ainda.{" "}
            <Link href="/admin/farms/new" style={{ color: "#00E1FF" }}>
              Criar primeira fazenda
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
