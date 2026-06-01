"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { useToast } from "@/components/shared/Toast";
import { formatHa, formatDate } from "@/lib/utils";

export function FarmsAdminTable({ initialFarms }: { initialFarms: any[] }) {
  const supabase = createClient();
  const { showToast, ToastComponent } = useToast();
  const [farms, setFarms] = useState(initialFarms);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from("farms").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setFarms((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      showToast("Fazenda excluída com sucesso.", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao excluir.", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  if (farms.length === 0) {
    return (
      <div className="atlas-card p-12 text-center">
        <p className="font-montserrat text-sm mb-4" style={{ color: "#8BA3B5" }}>
          Nenhuma fazenda cadastrada ainda.
        </p>
        <Link href="/admin/farms/new" className="btn-atlas-copper">
          Criar primeira fazenda
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="atlas-card overflow-hidden">
        <div className="table-wrap">
          <table className="atlas-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cliente</th>
                <th>Localização</th>
                <th>Área Total</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {farms.map((farm) => (
                <tr key={farm.id}>
                  <td className="font-semibold" style={{ color: "#F2F2F2" }}>
                    {farm.name}
                  </td>
                  <td style={{ color: "#8BA3B5" }}>{farm.client?.name ?? "—"}</td>
                  <td style={{ color: "#8BA3B5" }}>
                    {farm.city}, {farm.state}
                  </td>
                  <td style={{ color: "#FFA23A" }}>
                    {formatHa(farm.total_area_ha)} ha
                  </td>
                  <td style={{ color: "#8BA3B5" }}>{formatDate(farm.created_at)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/farms/${farm.id}`}
                        className="font-montserrat text-xs font-600 px-3 py-1.5 rounded border"
                        style={{ color: "#00E1FF", borderColor: "rgba(0,225,255,0.3)" }}
                      >
                        Gerenciar
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(farm)}
                        className="font-montserrat text-xs font-600 px-3 py-1.5 rounded border"
                        style={{ color: "#ff6b6b", borderColor: "rgba(255,107,107,0.3)" }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Excluir fazenda"
        description={`Excluir "${deleteTarget?.name}"? Todos os materiais (modelos, imagens, PDFs etc.) serão removidos.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
      {ToastComponent}
    </>
  );
}
