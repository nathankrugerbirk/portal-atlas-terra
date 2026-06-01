"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/Toast";
import { haToAlq } from "@/lib/utils";

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

export default function NewFarmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultClientId = searchParams.get("client_id") || "";
  const supabase = createClient();
  const { showToast, ToastComponent } = useToast();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    client_id: defaultClientId,
    name: "",
    city: "",
    state: "SP",
    total_area_ha: "",
    description: "",
  });

  useEffect(() => {
    supabase.from("clients").select("id, name").order("name").then(({ data }) => {
      setClients(data ?? []);
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id) { showToast("Selecione um cliente.", "error"); return; }
    if (!form.name || !form.city || !form.total_area_ha) {
      showToast("Preencha os campos obrigatórios.", "error"); return;
    }
    setLoading(true);
    try {
      const ha = parseFloat(form.total_area_ha);
      const alq = haToAlq(ha);
      let cover_image_path: string | null = null;

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const filePath = `covers/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("farm-images")
          .upload(filePath, coverFile);
        if (!uploadError) cover_image_path = filePath;
      }

      const { data: farm, error } = await supabase
        .from("farms")
        .insert({
          client_id: form.client_id,
          name: form.name,
          city: form.city,
          state: form.state,
          total_area_ha: ha,
          total_area_alq: parseFloat(alq.toFixed(2)),
          description: form.description || null,
          cover_image_path,
        })
        .select()
        .single();

      if (error) throw error;
      showToast("Fazenda criada com sucesso!", "success");
      setTimeout(() => router.push(`/admin/farms/${farm.id}`), 1200);
    } catch (err: any) {
      showToast(err.message || "Erro ao criar fazenda.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/farms" style={{ color: "#8BA3B5" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="font-orbitron font-bold text-xl" style={{ color: "#F2F2F2" }}>Nova Fazenda</h1>
          <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>Cadastre uma nova propriedade</p>
        </div>
      </div>

      <div className="atlas-card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="atlas-label">Cliente vinculado *</label>
            <select name="client_id" value={form.client_id} onChange={handleChange} className="atlas-input" required>
              <option value="">Selecione um cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="atlas-label">Nome da fazenda *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Ex: Fazenda Santa Cruz" className="atlas-input" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="atlas-label">Município *</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Ex: Ribeirão Preto" className="atlas-input" required />
            </div>
            <div>
              <label className="atlas-label">Estado *</label>
              <select name="state" value={form.state} onChange={handleChange} className="atlas-input">
                {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="atlas-label">Área total (ha) *</label>
            <input
              name="total_area_ha"
              type="number"
              step="0.01"
              value={form.total_area_ha}
              onChange={handleChange}
              placeholder="Ex: 1200.50"
              className="atlas-input"
              required
            />
            {form.total_area_ha && (
              <p className="font-montserrat text-xs mt-1" style={{ color: "rgba(255,162,58,0.7)" }}>
                ≈ {haToAlq(parseFloat(form.total_area_ha)).toFixed(2)} alqueires paulistas
              </p>
            )}
          </div>

          <div>
            <label className="atlas-label">Imagem de capa</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="atlas-input"
              style={{ paddingTop: "8px" }}
            />
          </div>

          <div>
            <label className="atlas-label">Descrição curta</label>
            <textarea
              name="description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descrição opcional da propriedade"
              className="atlas-input resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-atlas-copper" disabled={loading}>
              {loading ? "Criando..." : "Criar fazenda"}
            </button>
            <Link href="/admin/farms" className="btn-atlas-outline">Cancelar</Link>
          </div>
        </form>
      </div>
      {ToastComponent}
    </div>
  );
}
