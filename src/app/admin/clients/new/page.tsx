"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/shared/Toast";

export default function NewClientPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) {
      showToast("Preencha todos os campos obrigatórios.", "error");
      return;
    }
    if (form.password.length < 6) {
      showToast("A senha deve ter no mínimo 6 caracteres.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Cliente criado com sucesso!", "success");
      setTimeout(() => router.push("/admin/clients"), 1200);
    } catch (err: any) {
      showToast(err.message || "Erro ao criar cliente.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/clients" style={{ color: "#8BA3B5" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="font-orbitron font-bold text-xl" style={{ color: "#F2F2F2" }}>
            Novo Cliente
          </h1>
          <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
            Crie o acesso de um novo cliente
          </p>
        </div>
      </div>

      <div className="atlas-card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="atlas-label">Nome completo *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: João Silva"
              className="atlas-input"
              required
            />
          </div>

          <div>
            <label className="atlas-label">Username *</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Ex: joaosilva"
              className="atlas-input"
              required
              autoComplete="off"
            />
            <p className="font-montserrat text-xs mt-1" style={{ color: "rgba(139,163,181,0.6)" }}>
              O cliente usará este nome para fazer login. Sem espaços.
            </p>
          </div>

          <div>
            <label className="atlas-label">Senha inicial *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className="atlas-input"
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="atlas-label">Observações internas</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Anotações internas sobre o cliente (opcional)"
              className="atlas-input resize-none"
              rows={3}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button type="submit" className="btn-atlas-primary" disabled={loading}>
              {loading ? "Criando..." : "Criar cliente"}
            </button>
            <Link href="/admin/clients" className="btn-atlas-outline">
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {ToastComponent}
    </div>
  );
}
