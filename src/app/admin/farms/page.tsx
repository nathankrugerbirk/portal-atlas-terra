import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FarmsAdminTable } from "./FarmsAdminTable";

export default async function FarmsPage() {
  const supabase = await createClient();

  const { data: farms } = await supabase
    .from("farms")
    .select("*, client:clients(name, profile:profiles(username))")
    .order("created_at", { ascending: false });

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-orbitron font-bold text-2xl mb-1" style={{ color: "#F2F2F2" }}>
            Fazendas
          </h1>
          <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
            Gerencie as fazendas e seus materiais técnicos
          </p>
        </div>
        <Link href="/admin/farms/new" className="btn-atlas-copper flex-shrink-0">
          + Nova Fazenda
        </Link>
      </div>

      <FarmsAdminTable initialFarms={farms ?? []} />
    </div>
  );
}
