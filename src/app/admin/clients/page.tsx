import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ClientsTable } from "./ClientsTable";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, profile:profiles(*)")
    .order("created_at", { ascending: false });

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-orbitron font-bold text-2xl mb-1" style={{ color: "#F2F2F2" }}>
            Clientes
          </h1>
          <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
            Gerencie os clientes cadastrados na plataforma
          </p>
        </div>
        <Link href="/admin/clients/new" className="btn-atlas-primary flex-shrink-0">
          + Novo Cliente
        </Link>
      </div>

      <ClientsTable initialClients={clients ?? []} />
    </div>
  );
}
