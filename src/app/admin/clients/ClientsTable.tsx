"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { useToast } from "@/components/shared/Toast";
import { formatDate } from "@/lib/utils";

interface ClientRow {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  profile: {
    id: string;
    auth_user_id: string;
    username: string;
    status: string;
  } | null;
}

export function ClientsTable({ initialClients }: { initialClients: ClientRow[] }) {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [clients, setClients] = useState(initialClients);
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState<ClientRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleDelete() {
    if (!deleteTarget?.profile) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: deleteTarget.profile.auth_user_id,
          profile_id: deleteTarget.profile.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast("Cliente excluído com sucesso.", "success");
    } catch (err: any) {
      showToast(err.message || "Erro ao excluir cliente.", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  async function handleResetPassword() {
    if (!resetTarget?.profile || !newPassword) return;
    if (newPassword.length < 6) {
      showToast("A senha deve ter no mínimo 6 caracteres.", "error");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: resetTarget.profile.auth_user_id,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Senha redefinida com sucesso.", "success");
      setResetTarget(null);
      setNewPassword("");
    } catch (err: any) {
      showToast(err.message || "Erro ao redefinir senha.", "error");
    } finally {
      setResetLoading(false);
    }
  }

  if (clients.length === 0) {
    return (
      <div className="atlas-card p-12 text-center">
        <p className="font-montserrat text-sm mb-4" style={{ color: "#8BA3B5" }}>
          Nenhum cliente cadastrado ainda.
        </p>
        <Link href="/admin/clients/new" className="btn-atlas-primary">
          Criar primeiro cliente
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
                <th>Username</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="font-semibold" style={{ color: "#F2F2F2" }}>
                    {client.name}
                  </td>
                  <td>
                    <code className="font-montserrat text-xs px-2 py-1 rounded" style={{ background: "rgba(0,225,255,0.07)", color: "#00E1FF" }}>
                      {client.profile?.username ?? "—"}
                    </code>
                  </td>
                  <td>
                    <span className={client.profile?.status === "active" ? "badge-active" : "badge-inactive"}>
                      {client.profile?.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ color: "#8BA3B5" }}>{formatDate(client.created_at)}</td>
                  <td>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="font-montserrat text-xs font-600 px-3 py-1.5 rounded border transition-colors"
                        style={{ color: "#00E1FF", borderColor: "rgba(0,225,255,0.3)" }}
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => { setResetTarget(client); setNewPassword(""); }}
                        className="font-montserrat text-xs font-600 px-3 py-1.5 rounded border transition-colors"
                        style={{ color: "#00E6FF", borderColor: "rgba(0,230,255,0.25)" }}
                      >
                        Redefinir senha
                      </button>
                      <button
                        onClick={() => setDeleteTarget(client)}
                        className="font-montserrat text-xs font-600 px-3 py-1.5 rounded border transition-colors"
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

      {/* Modal excluir */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Excluir cliente"
        description={`Deseja excluir o cliente "${deleteTarget?.name}"? Esta ação é irreversível e removerá todos os dados vinculados.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Modal redefinir senha */}
      {resetTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,7,15,0.85)" }}
        >
          <div className="atlas-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="font-orbitron font-bold text-base mb-4" style={{ color: "#F2F2F2" }}>
              Redefinir senha
            </h3>
            <p className="font-montserrat text-sm mb-4" style={{ color: "#8BA3B5" }}>
              Nova senha para <strong style={{ color: "#00E1FF" }}>{resetTarget.profile?.username}</strong>
            </p>
            <input
              type="password"
              placeholder="Nova senha (mín. 6 caracteres)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="atlas-input mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setResetTarget(null)} className="btn-atlas-outline" disabled={resetLoading}>
                Cancelar
              </button>
              <button onClick={handleResetPassword} className="btn-atlas-copper" disabled={resetLoading}>
                {resetLoading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastComponent}
    </>
  );
}

