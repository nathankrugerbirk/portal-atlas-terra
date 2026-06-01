"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/Toast";

export function EditClientForm({ client }: { client: any }) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast, ToastComponent } = useToast();

  const [form, setForm] = useState({
    name: client.name || "",
    notes: client.profile?.notes || client.notes || "",
    status: client.profile?.status || "active",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: form.name, status: form.status })
        .eq("id", client.profile.id);

      await supabase
        .from("clients")
        .update({ name: form.name, notes: form.notes || null })
        .eq("id", client.id);

      if (error) throw error;
      showToast("Cliente atualizado com sucesso!", "success");
      setTimeout(() => router.push("/admin/clients"), 1200);
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/clients" style={{ color: "#8BA3B5" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="font-orbitron font-bold text-xl" style={{ color: "#F2F2F2" }}>
            Editar Cliente
          </h1>
          <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
            {client.profile?.username}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="atlas-card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="atlas-label">Nome completo *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="atlas-input"
                required
              />
            </div>
            <div>
              <label className="atlas-label">Username</label>
              <input
                value={client.profile?.username || ""}
                className="atlas-input opacity-50"
                disabled
                title="O username não pode ser alterado"
              />
            </div>
            <div>
              <label className="atlas-label">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="atlas-input"
                style={{ cursor: "pointer" }}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div>
              <label className="atlas-label">Observações internas</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="atlas-input resize-none"
                rows={3}
                placeholder="Anotações internas (opcional)"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-atlas-primary" disabled={loading}>
                {loading ? "Salvando..." : "Salvar alterações"}
              </button>
              <Link href="/admin/clients" className="btn-atlas-outline">
                Cancelar
              </Link>
            </div>
          </form>
        </div>

        {/* Fazendas do cliente */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest" style={{ color: "#00E1FF" }}>
              Fazendas
            </h3>
            <Link
              href={`/admin/farms/new?client_id=${client.id}`}
              className="font-montserrat text-xs font-600"
              style={{ color: "#FFA23A" }}
            >
              + Nova fazenda
            </Link>
          </div>

          {client.farms && client.farms.length > 0 ? (
            <div className="space-y-2">
              {client.farms.map((farm: any) => (
                <Link
                  key={farm.id}
                  href={`/admin/farms/${farm.id}`}
                  className="atlas-card p-4 flex items-center justify-between hover:border-atlas-cyan transition-colors block"
                >
                  <div>
                    <p className="font-montserrat font-semibold text-sm" style={{ color: "#F2F2F2" }}>
                      {farm.name}
                    </p>
                    <p className="font-montserrat text-xs mt-0.5" style={{ color: "#8BA3B5" }}>
                      {farm.city}, {farm.state}
                    </p>
                  </div>
                  <span style={{ color: "#00E1FF" }}>→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className="atlas-card p-6 text-center font-montserrat text-sm"
              style={{ color: "#8BA3B5" }}
            >
              Nenhuma fazenda vinculada.
            </div>
          )}
        </div>
      </div>

      {ToastComponent}
    </div>
  );
}
