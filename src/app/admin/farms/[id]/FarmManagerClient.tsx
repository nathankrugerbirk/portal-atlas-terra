"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/Toast";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { formatHa, formatAlq, haToAlq } from "@/lib/utils";

const SECTION_TABS = [
  "Dados Principais", "Modelo 3D", "Quadro de Áreas",
  "Mapas", "Imagens e Vídeos", "Documentação"
];

const DOC_TYPES = ["matricula", "ccir", "cib", "sigef", "car"] as const;
const DOC_LABELS: Record<string, string> = {
  matricula: "Matrícula", ccir: "CCIR", cib: "CIB", sigef: "SIGEF", car: "CAR"
};

export function FarmManagerClient({ farm, initialModels, initialAreaRows, initialDocNumbers,
  initialDocFiles, initialImages, initialVideos, initialPdfs }: any) {

  const supabase = createClient();
  const { showToast, ToastComponent } = useToast();
  const [activeTab, setActiveTab] = useState(0);

  // State for each section
  const [models, setModels] = useState<any[]>(initialModels);
  const [areaRows, setAreaRows] = useState<any[]>(initialAreaRows);
  const [docNumbers, setDocNumbers] = useState<any[]>(initialDocNumbers);
  const [docFiles, setDocFiles] = useState<any[]>(initialDocFiles);
  const [images, setImages] = useState<any[]>(initialImages);
  const [videos, setVideos] = useState<any[]>(initialVideos);
  const [pdfs, setPdfs] = useState<any[]>(initialPdfs);

  // ── Modelo 3D/2D ──────────────────────────────────────────────────────
  function getModel(type: "3d" | "2d") { return models.find((m) => m.type === type) || null; }

  async function saveModel(type: "3d" | "2d", url: string, title: string) {
    const existing = getModel(type);
    if (existing) {
      const { data, error } = await supabase.from("farm_models")
        .update({ cesium_url: url, title }).eq("id", existing.id).select().single();
      if (error) { showToast("Erro ao salvar modelo.", "error"); return; }
      setModels((prev) => prev.map((m) => m.id === existing.id ? data : m));
    } else {
      const { data, error } = await supabase.from("farm_models")
        .insert({ farm_id: farm.id, type, cesium_url: url, title }).select().single();
      if (error) { showToast("Erro ao salvar modelo.", "error"); return; }
      setModels((prev) => [...prev, data]);
    }
    showToast("Modelo salvo!", "success");
  }

  // ── Quadro de áreas ───────────────────────────────────────────────────
  async function saveAreaRow(row: any) {
    if (row.id) {
      const { data, error } = await supabase.from("area_table_rows")
        .update(row).eq("id", row.id).select().single();
      if (error) { showToast("Erro ao salvar linha.", "error"); return; }
      setAreaRows((prev) => prev.map((r) => r.id === row.id ? data : r));
    } else {
      const { data, error } = await supabase.from("area_table_rows")
        .insert({ ...row, farm_id: farm.id, sort_order: areaRows.length }).select().single();
      if (error) { showToast("Erro ao criar linha.", "error"); return; }
      setAreaRows((prev) => [...prev, data]);
    }
    showToast("Linha salva!", "success");
  }

  async function deleteAreaRow(id: string) {
    const { error } = await supabase.from("area_table_rows").delete().eq("id", id);
    if (error) { showToast("Erro ao excluir.", "error"); return; }
    setAreaRows((prev) => prev.filter((r) => r.id !== id));
    showToast("Linha excluída.", "success");
  }

  async function reorderAreaRows(newOrder: any[]) {
    setAreaRows(newOrder);
    // Persiste sort_order no banco
    for (let i = 0; i < newOrder.length; i++) {
      await supabase.from("area_table_rows").update({ sort_order: i }).eq("id", newOrder[i].id);
    }
  }

  // ── Upload de arquivos ────────────────────────────────────────────────
  async function uploadFile(file: File, bucket: string, folder: string): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${farm.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) return null;
    return path;
  }

  async function uploadDocFile(file: File, title: string, doc_type: string) {
    const path = await uploadFile(file, "farm-documents", "docs");
    if (!path) { showToast("Erro no upload.", "error"); return; }
    const { data, error } = await supabase.from("property_document_files")
      .insert({ farm_id: farm.id, title, document_type: doc_type, file_path: path })
      .select().single();
    if (error) { showToast("Erro ao salvar arquivo.", "error"); return; }
    setDocFiles((prev) => [...prev, data]);
    showToast("Arquivo enviado!", "success");
  }

  async function deleteDocFile(id: string, file_path: string) {
    await supabase.storage.from("farm-documents").remove([file_path]);
    await supabase.from("property_document_files").delete().eq("id", id);
    setDocFiles((prev) => prev.filter((f) => f.id !== id));
    showToast("Arquivo removido.", "success");
  }

  async function uploadImage(file: File) {
    const path = await uploadFile(file, "farm-images", "images");
    if (!path) { showToast("Erro no upload.", "error"); return; }
    const { data, error } = await supabase.from("farm_images")
      .insert({ farm_id: farm.id, file_path: path, sort_order: images.length })
      .select().single();
    if (error) { showToast("Erro ao salvar imagem.", "error"); return; }
    setImages((prev) => [...prev, data]);
    showToast("Imagem enviada!", "success");
  }

  async function deleteImage(id: string, file_path: string) {
    await supabase.storage.from("farm-images").remove([file_path]);
    await supabase.from("farm_images").delete().eq("id", id);
    setImages((prev) => prev.filter((i) => i.id !== id));
    showToast("Imagem removida.", "success");
  }

  async function saveVideo(video: any) {
    if (video.id) {
      const { data, error } = await supabase.from("farm_videos")
        .update(video).eq("id", video.id).select().single();
      if (error) { showToast("Erro ao salvar vídeo.", "error"); return; }
      setVideos((prev) => prev.map((v) => v.id === video.id ? data : v));
    } else {
      const { data, error } = await supabase.from("farm_videos")
        .insert({ ...video, farm_id: farm.id, sort_order: videos.length }).select().single();
      if (error) { showToast("Erro ao criar vídeo.", "error"); return; }
      setVideos((prev) => [...prev, data]);
    }
    showToast("Vídeo salvo!", "success");
  }

  async function deleteVideo(id: string) {
    await supabase.from("farm_videos").delete().eq("id", id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
    showToast("Vídeo removido.", "success");
  }

  async function uploadPdf(file: File, title: string, category: "mapa" | "relatorio") {
    const path = await uploadFile(file, "farm-documents", "pdfs");
    if (!path) { showToast("Erro no upload.", "error"); return; }
    const { data, error } = await supabase.from("technical_pdfs")
      .insert({ farm_id: farm.id, title, category, file_path: path, sort_order: pdfs.length })
      .select().single();
    if (error) { showToast("Erro ao salvar PDF.", "error"); return; }
    setPdfs((prev) => [...prev, data]);
    showToast("PDF enviado!", "success");
  }

  async function deletePdf(id: string, file_path: string) {
    await supabase.storage.from("farm-documents").remove([file_path]);
    await supabase.from("technical_pdfs").delete().eq("id", id);
    setPdfs((prev) => prev.filter((p) => p.id !== id));
    showToast("PDF removido.", "success");
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/farms" style={{ color: "#8BA3B5" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div>
            <h1 className="font-orbitron font-bold text-xl" style={{ color: "#F2F2F2" }}>{farm.name}</h1>
            <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
              {farm.city}, {farm.state} · {farm.client?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-sm" style={{ color: "#00E6FF" }}>
          <span className="font-montserrat font-semibold">{formatHa(farm.total_area_ha)} ha</span>
          <span style={{ color: "#8BA3B5" }}>·</span>
          <span className="font-montserrat">{formatAlq(farm.total_area_alq)} alq</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-6" style={{ borderBottom: "1px solid rgba(0,225,255,0.12)" }}>
        {SECTION_TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`atlas-tab ${activeTab === i ? "active" : ""}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* 0: Dados Principais */}
      {activeTab === 0 && <FarmBasicDataSection farm={farm} supabase={supabase} showToast={showToast} />}

      {/* 1: Modelo 3D */}
      {activeTab === 1 && <ModelSection type="3d" model={getModel("3d")} onSave={(u, t) => saveModel("3d", u, t)} />}

      {/* 2: Quadro de Áreas */}
      {activeTab === 2 && <AreaTableSection rows={areaRows} onSave={saveAreaRow} onDelete={deleteAreaRow} onReorder={reorderAreaRows} />}

      {/* 3: Mapas */}
      {activeTab === 3 && (
        <PdfsSection pdfs={pdfs} onUpload={uploadPdf} onDelete={deletePdf} />
      )}

      {/* 4: Imagens e Vídeos */}
      {activeTab === 4 && (
        <ImagesVideosSection
          images={images} videos={videos}
          onUploadImage={uploadImage} onDeleteImage={deleteImage}
          onSaveVideo={saveVideo} onDeleteVideo={deleteVideo}
        />
      )}

      {/* 5: Documentação */}
      {activeTab === 5 && (
        <DocumentationSection
          farmId={farm.id} docNumbers={docNumbers} docFiles={docFiles}
          supabase={supabase} showToast={showToast}
          onDocNumbersChange={setDocNumbers} onUpload={uploadDocFile} onDeleteFile={deleteDocFile}
        />
      )}

      {ToastComponent}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function FarmBasicDataSection({ farm, supabase, showToast }: any) {
  const [form, setForm] = useState({ name: farm.name, city: farm.city, state: farm.state,
    total_area_ha: farm.total_area_ha, description: farm.description || "" });
  const [loading, setLoading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const ha = parseFloat(String(form.total_area_ha));
    const { error } = await supabase.from("farms").update({
      ...form, total_area_ha: ha, total_area_alq: parseFloat(haToAlq(ha).toFixed(2))
    }).eq("id", farm.id);
    setLoading(false);
    if (error) { showToast("Erro ao salvar.", "error"); return; }
    showToast("Dados salvos!", "success");
  }

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    if (file) setCoverPreview(URL.createObjectURL(file));
  }

  async function saveCover() {
    if (!coverFile) return;
    setCoverLoading(true);
    const ext = coverFile.name.split(".").pop();
    const path = `covers/${farm.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("farm-images").upload(path, coverFile, { upsert: true });
    if (uploadError) { showToast("Erro no upload da capa.", "error"); setCoverLoading(false); return; }
    const { error: updateError } = await supabase.from("farms").update({ cover_image_path: path }).eq("id", farm.id);
    setCoverLoading(false);
    if (updateError) { showToast("Erro ao salvar capa.", "error"); return; }
    showToast("Capa atualizada!", "success");
    setCoverFile(null);
  }

  return (
    <div className="space-y-5 max-w-lg">
      {/* Capa do card */}
      <div className="atlas-card p-5">
        <h4 className="font-orbitron font-semibold text-xs uppercase tracking-widest mb-4" style={{ color: "#00E6FF" }}>
          Imagem de Capa
        </h4>
        {coverPreview && (
          <div className="mb-3 rounded overflow-hidden" style={{ aspectRatio: "16/7", background: "#0D1117" }}>
            <img src={coverPreview} alt="Preview da capa" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <label className="atlas-label">Selecionar nova imagem</label>
            <input type="file" accept="image/*" onChange={handleCoverSelect} className="atlas-input" style={{ paddingTop: "7px" }} />
          </div>
          <button
            onClick={saveCover}
            disabled={!coverFile || coverLoading}
            className="btn-atlas-primary flex-shrink-0"
          >
            {coverLoading ? "Salvando..." : "Salvar capa"}
          </button>
        </div>
        <p style={{ fontFamily: "var(--font-main)", fontSize: "0.68rem", color: "rgba(139,148,158,0.5)", marginTop: 8 }}>
          Aparece no card da fazenda na área do cliente. Formatos: JPG, PNG, WEBP.
        </p>
      </div>

      {/* Dados da fazenda */}
      <div className="atlas-card p-6">
        <h4 className="font-orbitron font-semibold text-xs uppercase tracking-widest mb-4" style={{ color: "#00E6FF" }}>
          Dados da Propriedade
        </h4>
        <form onSubmit={save} className="space-y-4">
        <div><label className="atlas-label">Nome da fazenda</label>
          <input value={form.name} onChange={(e) => setForm(p => ({...p, name: e.target.value}))} className="atlas-input" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="atlas-label">Município</label>
            <input value={form.city} onChange={(e) => setForm(p => ({...p, city: e.target.value}))} className="atlas-input" /></div>
          <div><label className="atlas-label">Estado</label>
            <input value={form.state} onChange={(e) => setForm(p => ({...p, state: e.target.value}))} className="atlas-input" maxLength={2} /></div>
        </div>
        <div><label className="atlas-label">Área total (ha)</label>
          <input type="number" step="0.01" value={form.total_area_ha} onChange={(e) => setForm(p => ({...p, total_area_ha: parseFloat(e.target.value)}))} className="atlas-input" /></div>
        <div><label className="atlas-label">Descrição</label>
          <textarea value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} className="atlas-input resize-none" rows={3} /></div>
        <button type="submit" className="btn-atlas-primary" disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</button>
        </form>
      </div>
    </div>
  );
}

function ModelSection({ type, model, onSave }: { type: "3d" | "2d"; model: any; onSave: (url: string, title: string) => void }) {
  const [url, setUrl] = useState(model?.cesium_url || "");
  const [title, setTitle] = useState(model?.title || (type === "3d" ? "Modelo 3D" : "Modelo 2D"));

  return (
    <div className="atlas-card p-6 max-w-lg">
      <h3 className="font-orbitron font-semibold text-sm mb-4 uppercase tracking-widest" style={{ color: "#00E1FF" }}>
        {type === "3d" ? "Modelo 3D — Cesium" : "Modelo 2D — Cesium / Shapes"}
      </h3>
      <div className="space-y-4">
        <div><label className="atlas-label">Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="atlas-input" /></div>
        <div><label className="atlas-label">URL do Cesium</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="atlas-input" placeholder="https://ion.cesium.com/stories/..." /></div>
        <button onClick={() => onSave(url, title)} className="btn-atlas-primary" disabled={!url}>
          {model ? "Atualizar link" : "Salvar link"}
        </button>
      </div>
      {url && (
        <div className="mt-4 p-3 rounded" style={{ background: "rgba(0,225,255,0.05)", border: "1px solid rgba(0,225,255,0.15)" }}>
          <p className="font-montserrat text-xs" style={{ color: "#8BA3B5" }}>Preview do link:</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="font-montserrat text-xs break-all" style={{ color: "#00E1FF" }}>{url}</a>
        </div>
      )}
    </div>
  );
}

/* ── Paleta de cores para o gráfico ── */
const CHART_COLORS = [
  "#00E6FF","#0099AA","#3DD6F5","#005C77",
  "#00C4D4","#007799","#4DC8E0","#003D55",
  "#00B4CC","#006688","#66DFF5","#004466",
];

/* ── Componente de gráfico de pizza SVG ── */
function PieChart({ rows, totalHa }: { rows: any[]; totalHa: number }) {
  if (rows.length === 0 || totalHa === 0) return null;
  const cx = 120; const cy = 120; const r = 100;
  let currentAngle = -Math.PI / 2;
  const slices = rows.map((row: any, i: number) => {
    const pct = (row.area_ha || 0) / totalHa;
    const angle = pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(currentAngle);
    const y1 = cy + r * Math.sin(currentAngle);
    currentAngle += angle;
    const x2 = cx + r * Math.cos(currentAngle);
    const y2 = cy + r * Math.sin(currentAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const midAngle = currentAngle - angle / 2;
    return { x1, y1, x2, y2, largeArc, pct, color: CHART_COLORS[i % CHART_COLORS.length], label: row.class_name, midAngle, ha: row.area_ha || 0 };
  });
  return (
    <div style={{ marginTop: 32 }}>
      <h4 style={{ fontFamily: "var(--font-main)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8B949E", marginBottom: 16 }}>
        Distribuição por Classe
      </h4>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 32 }}>
        {/* Pizza */}
        <svg width="240" height="240" viewBox="0 0 240 240" style={{ flexShrink: 0 }}>
          {/* Anel externo decorativo */}
          <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="rgba(0,230,255,0.08)" strokeWidth="1" />
          {slices.map((s, i) => (
            <g key={i}>
              <path
                d={`M ${cx},${cy} L ${s.x1},${s.y1} A ${r},${r} 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
                fill={s.color}
                opacity="0.9"
                style={{ filter: `drop-shadow(0 0 4px ${s.color}40)` }}
              />
              {/* Borda fina entre fatias */}
              <path
                d={`M ${cx},${cy} L ${s.x1},${s.y1} A ${r},${r} 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
                fill="none"
                stroke="rgba(13,17,23,0.6)"
                strokeWidth="1.5"
              />
            </g>
          ))}
          {/* Círculo central (donut) */}
          <circle cx={cx} cy={cy} r={r * 0.42} fill="#0D1117" />
          <circle cx={cx} cy={cy} r={r * 0.42} fill="none" stroke="rgba(0,230,255,0.12)" strokeWidth="1" />
          {/* Texto central */}
          <text x={cx} y={cy - 8} textAnchor="middle" fill="#00E6FF"
            style={{ fontFamily: "var(--font-main)", fontSize: "13px", fontWeight: 700 }}>
            {rows.length}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#8B949E"
            style={{ fontFamily: "var(--font-main)", fontSize: "9px", letterSpacing: "0.08em" }}>
            CLASSES
          </text>
        </svg>
        {/* Legenda */}
        <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 8 }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0, boxShadow: `0 0 6px ${s.color}60` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-main)", fontSize: "0.8rem", color: "#F6F8FA", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.label}
                </p>
                <p style={{ fontFamily: "var(--font-main)", fontSize: "0.7rem", color: "#8B949E" }}>
                  {s.ha.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha · {(s.pct * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AreaTableSection({ rows, onSave, onDelete, onReorder }: any) {
  const [editingRow, setEditingRow] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [className, setClassName] = useState("");
  const [areaHaInput, setAreaHaInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Totais calculados a partir dos dados reais
  const totalHa = rows.reduce((s: number, r: any) => s + (r.area_ha || 0), 0);
  const totalAlq = totalHa / 2.42;

  function startEdit(row: any) {
    setClassName(row.class_name);
    setAreaHaInput(String(row.area_ha ?? ""));
    setEditingRow(row);
    setShowForm(true);
  }

  function startNew() {
    setClassName("");
    setAreaHaInput("");
    setEditingRow(null);
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setClassName("");
    setAreaHaInput("");
    setEditingRow(null);
  }

  function handleDragStart(i: number) { setDragIndex(i); }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const newRows = [...rows];
    const [moved] = newRows.splice(dragIndex, 1);
    newRows.splice(i, 0, moved);
    setDragIndex(i);
    onReorder(newRows);
  }
  function handleDragEnd() { setDragIndex(null); }

  async function handleSave() {
    const ha = parseFloat(areaHaInput);
    if (!className.trim() || isNaN(ha) || ha <= 0) return;
    const alq = ha / 2.42;
    // Percentual salvo como 0 — calculado dinamicamente na exibição
    await onSave({
      id: editingRow?.id,
      class_name: className.trim(),
      area_ha: parseFloat(ha.toFixed(2)),
      area_alq: parseFloat(alq.toFixed(2)),
      percentage: 0,
    });
    cancel();
  }

  // Preview ao vivo no formulário
  const previewHa = parseFloat(areaHaInput) || 0;
  const previewAlq = previewHa / 2.42;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest" style={{ color: "#00E6FF" }}>
          Quadro de Áreas
        </h3>
        <button onClick={startNew} className="btn-atlas-primary text-sm px-4 py-2">+ Adicionar linha</button>
      </div>

      {/* ── Formulário ── */}
      {showForm && (
        <div className="atlas-card p-5 mb-5 animate-slide-up" style={{ maxWidth: 520 }}>
          <h4 className="font-montserrat font-semibold text-sm mb-4" style={{ color: "#F6F8FA" }}>
            {editingRow ? "Editar linha" : "Nova linha"}
          </h4>

          <div className="space-y-4">
            {/* Classe */}
            <div>
              <label className="atlas-label">Classe / Categoria</label>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="atlas-input"
                placeholder="Ex: Pastagem, Reserva Legal, Cultura..."
              />
            </div>

            {/* Área (ha) — único campo editável */}
            <div>
              <label className="atlas-label">Área (ha)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={areaHaInput}
                onChange={(e) => setAreaHaInput(e.target.value)}
                className="atlas-input"
                placeholder="Ex: 250,00"
              />
            </div>

            {/* Preview calculado */}
            {previewHa > 0 && (
              <div
                className="grid grid-cols-2 gap-3 p-3 rounded"
                style={{ background: "rgba(0,230,255,0.04)", border: "1px solid rgba(0,230,255,0.12)" }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-main)", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8B949E", marginBottom: 4 }}>
                    Alqueires (calculado)
                  </p>
                  <p style={{ fontFamily: "var(--font-main)", fontSize: "0.95rem", fontWeight: 700, color: "#00E6FF" }}>
                    {previewAlq.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-main)", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8B949E", marginBottom: 4 }}>
                    % do total atual
                  </p>
                  <p style={{ fontFamily: "var(--font-main)", fontSize: "0.95rem", fontWeight: 700, color: "#00E6FF" }}>
                    {totalHa > 0
                      ? ((previewHa / (editingRow ? totalHa - (editingRow.area_ha || 0) + previewHa : totalHa + previewHa)) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%"
                      : "100,0%"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} className="btn-atlas-primary" disabled={!className.trim() || !areaHaInput || parseFloat(areaHaInput) <= 0}>
              Salvar
            </button>
            <button onClick={cancel} className="btn-atlas-outline">Cancelar</button>
          </div>
        </div>
      )}

      {/* ── Tabela ── */}
      {rows.length > 0 ? (
        <>
          <div className="atlas-card overflow-hidden">
            <div className="table-wrap">
              <table className="atlas-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Classe / Categoria</th>
                    <th>Área (ha)</th>
                    <th>Área (alq)</th>
                    <th>%</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any, i: number) => {
                    const alq = (row.area_ha || 0) / 2.42;
                    const pct = totalHa > 0 ? ((row.area_ha || 0) / totalHa) * 100 : 0;
                    const isDragging = dragIndex === i;
                    return (
                      <tr
                        key={row.id}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDragEnd={handleDragEnd}
                        style={{
                          opacity: isDragging ? 0.5 : 1,
                          cursor: "grab",
                          transition: "opacity 0.15s",
                        }}
                      >
                        {/* Handle de arrastar */}
                        <td style={{ padding: "8px 8px 8px 14px", color: "#3A3F44", cursor: "grab" }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <rect x="3" y="3" width="3" height="3" rx="1"/>
                            <rect x="10" y="3" width="3" height="3" rx="1"/>
                            <rect x="3" y="9" width="3" height="3" rx="1"/>
                            <rect x="10" y="9" width="3" height="3" rx="1"/>
                          </svg>
                        </td>
                        <td style={{ color: "#F6F8FA" }}>{row.class_name}</td>
                        <td style={{ color: "#00E6FF", fontVariantNumeric: "tabular-nums" }}>
                          {(row.area_ha || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ color: "#8B949E", fontVariantNumeric: "tabular-nums" }}>
                          {alq.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full flex-1 max-w-[60px]" style={{ background: "rgba(0,230,255,0.1)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: "#00E6FF" }} />
                            </div>
                            <span style={{ color: "#00E6FF", fontVariantNumeric: "tabular-nums", minWidth: "42px", fontSize: "0.85rem" }}>
                              {pct.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(row)} className="font-montserrat text-xs px-3 py-1 rounded border" style={{ color: "#00E6FF", borderColor: "rgba(0,230,255,0.3)" }}>Editar</button>
                            <button onClick={() => setDeleteTarget(row.id)} className="font-montserrat text-xs px-3 py-1 rounded border" style={{ color: "#f85149", borderColor: "rgba(248,81,73,0.3)" }}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid rgba(0,230,255,0.2)", background: "rgba(0,230,255,0.04)" }}>
                    <td />
                    <td style={{ color: "#F6F8FA", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 16px" }}>Total</td>
                    <td style={{ color: "#00E6FF", fontWeight: 700, fontVariantNumeric: "tabular-nums", padding: "12px 16px" }}>
                      {totalHa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: "#8B949E", fontWeight: 600, fontVariantNumeric: "tabular-nums", padding: "12px 16px" }}>
                      {totalAlq.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "12px 16px" }}><span style={{ color: "#00E6FF", fontWeight: 700 }}>100,0%</span></td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Gráfico de pizza */}
          <div className="atlas-card p-5 mt-4">
            <PieChart rows={rows} totalHa={totalHa} />
          </div>

          <p style={{ fontFamily: "var(--font-main)", fontSize: "0.7rem", color: "rgba(139,148,158,0.5)", marginTop: 8, letterSpacing: "0.04em" }}>
            ↕ Arraste as linhas para reordenar
          </p>
        </>
      ) : (
        <div className="atlas-card p-8 text-center font-montserrat text-sm" style={{ color: "#8B949E" }}>
          Nenhuma linha cadastrada. Clique em "+ Adicionar linha" para começar.
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Excluir linha"
        description="Excluir esta linha do quadro de áreas?"
        loading={false}
        onConfirm={() => { if (deleteTarget) onDelete(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DocumentationSection({ farmId, docNumbers, docFiles, supabase, showToast,
  onDocNumbersChange, onUpload, onDeleteFile }: any) {
  const [numbers, setNumbers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    docNumbers.forEach((d: any) => { map[d.document_type] = d.document_number; });
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("matricula");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  async function saveNumbers() {
    setSaving(true);
    for (const doc_type of DOC_TYPES) {
      const num = numbers[doc_type] || "";
      const existing = docNumbers.find((d: any) => d.document_type === doc_type);
      if (existing) {
        await supabase.from("property_document_numbers").update({ document_number: num }).eq("id", existing.id);
      } else if (num) {
        await supabase.from("property_document_numbers").insert({ farm_id: farmId, document_type: doc_type, document_number: num });
      }
    }
    setSaving(false);
    showToast("Dados documentais salvos!", "success");
  }

  async function handleUpload() {
    if (!uploadFile || !uploadTitle) { showToast("Preencha o título e selecione o arquivo.", "error"); return; }
    await onUpload(uploadFile, uploadTitle, uploadType);
    setUploadTitle(""); setUploadFile(null);
  }

  return (
    <div className="space-y-6">
      {/* Números documentais */}
      <div className="atlas-card p-6 max-w-lg">
        <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E1FF" }}>
          Dados Documentais
        </h3>
        <div className="space-y-3">
          {DOC_TYPES.map((dt) => (
            <div key={dt} className="flex items-center gap-3">
              <span className="font-montserrat text-sm w-20 flex-shrink-0" style={{ color: "#8BA3B5" }}>{DOC_LABELS[dt]}</span>
              <input value={numbers[dt] || ""} onChange={(e) => setNumbers(p => ({...p, [dt]: e.target.value}))}
                className="atlas-input flex-1" placeholder={`Número do ${DOC_LABELS[dt]}`} />
            </div>
          ))}
        </div>
        <button onClick={saveNumbers} className="btn-atlas-primary mt-4" disabled={saving}>
          {saving ? "Salvando..." : "Salvar dados"}
        </button>
      </div>

      {/* Arquivos de documentação */}
      <div className="atlas-card p-6">
        <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E1FF" }}>
          Arquivos dos Documentos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 max-w-2xl">
          <div><label className="atlas-label">Título</label>
            <input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="atlas-input" placeholder="Ex: Matrícula original" /></div>
          <div><label className="atlas-label">Tipo</label>
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="atlas-input">
              {DOC_TYPES.map((dt) => <option key={dt} value={dt}>{DOC_LABELS[dt]}</option>)}
              <option value="outro">Outro</option>
            </select></div>
          <div><label className="atlas-label">Arquivo PDF</label>
            <input type="file" accept="application/pdf" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} className="atlas-input" style={{ paddingTop: "7px" }} /></div>
        </div>
        <button onClick={handleUpload} className="btn-atlas-primary mb-6">Enviar arquivo</button>

        {docFiles.length > 0 ? (
          <div className="space-y-2">
            {docFiles.map((f: any) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded" style={{ background: "rgba(0,225,255,0.04)", border: "1px solid rgba(0,225,255,0.1)" }}>
                <span style={{ color: "#ff4444" }}>📄</span>
                <span className="flex-1 font-montserrat text-sm" style={{ color: "#F2F2F2" }}>{f.title}</span>
                <span className="font-montserrat text-xs px-2 py-0.5 rounded" style={{ background: "rgba(0,225,255,0.1)", color: "#00E1FF" }}>{f.document_type}</span>
                <button onClick={() => setDeleteTarget(f)} className="font-montserrat text-xs px-3 py-1 rounded border" style={{ color: "#ff6b6b", borderColor: "rgba(255,107,107,0.3)" }}>Excluir</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>Nenhum arquivo enviado ainda.</p>
        )}
      </div>

      <ConfirmDeleteModal isOpen={!!deleteTarget} title="Excluir arquivo"
        description={`Excluir o arquivo "${deleteTarget?.title}"?`} loading={false}
        onConfirm={() => { if (deleteTarget) onDeleteFile(deleteTarget.id, deleteTarget.file_path); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function ImagesVideosSection({ images, videos, onUploadImage, onDeleteImage, onSaveVideo, onDeleteVideo }: any) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [deleteImgTarget, setDeleteImgTarget] = useState<any>(null);
  const [deleteVidTarget, setDeleteVidTarget] = useState<any>(null);

  function detectProvider(url: string) {
    if (url.includes("youtube") || url.includes("youtu.be")) return "youtube";
    if (url.includes("vimeo")) return "vimeo";
    return "other";
  }

  return (
    <div className="space-y-8">
      {/* Imagens */}
      <div>
        <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E1FF" }}>Imagens</h3>
        <div className="flex gap-3 items-end mb-5 flex-wrap">
          <div>
            <label className="atlas-label">Selecionar imagem</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="atlas-input" style={{ paddingTop: "7px", width: "300px" }} />
          </div>
          <button onClick={() => { if (imageFile) { onUploadImage(imageFile); setImageFile(null); } }} className="btn-atlas-primary" disabled={!imageFile}>Enviar imagem</button>
        </div>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img: any) => (
              <div key={img.id} className="relative group rounded overflow-hidden" style={{ border: "1px solid rgba(0,225,255,0.15)", aspectRatio: "4/3", background: "#0D1E2C" }}>
                <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: "#8BA3B5" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setDeleteImgTarget(img)} className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "rgba(255,77,77,0.8)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 6h18M19 6l-1 14H6L5 6"/></svg>
                  </button>
                </div>
                <p className="absolute bottom-0 left-0 right-0 text-xs p-1 truncate" style={{ background: "rgba(0,0,0,0.5)", color: "#8BA3B5" }}>{img.file_path.split("/").pop()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>Nenhuma imagem enviada ainda.</p>
        )}
      </div>

      {/* Vídeos */}
      <div>
        <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E1FF" }}>Vídeos</h3>
        <div className="atlas-card p-5 max-w-lg mb-5">
          <div className="space-y-3">
            <div><label className="atlas-label">Título do vídeo</label>
              <input value={editingVideo ? editingVideo.title : videoTitle}
                onChange={(e) => editingVideo ? setEditingVideo({...editingVideo, title: e.target.value}) : setVideoTitle(e.target.value)}
                className="atlas-input" placeholder="Ex: Levantamento aéreo 2024" /></div>
            <div><label className="atlas-label">URL do YouTube</label>
              <input value={editingVideo ? editingVideo.video_url : videoUrl}
                onChange={(e) => editingVideo ? setEditingVideo({...editingVideo, video_url: e.target.value}) : setVideoUrl(e.target.value)}
                className="atlas-input" placeholder="https://youtu.be/..." /></div>
          </div>
          <div className="flex gap-3 mt-4">
            {editingVideo ? (
              <>
                <button onClick={() => { onSaveVideo({...editingVideo, video_provider: detectProvider(editingVideo.video_url)}); setEditingVideo(null); }} className="btn-atlas-primary">Salvar</button>
                <button onClick={() => setEditingVideo(null)} className="btn-atlas-outline">Cancelar</button>
              </>
            ) : (
              <button onClick={() => { if (videoUrl && videoTitle) { onSaveVideo({ title: videoTitle, video_url: videoUrl, video_provider: detectProvider(videoUrl) }); setVideoTitle(""); setVideoUrl(""); } }} className="btn-atlas-primary" disabled={!videoUrl || !videoTitle}>
                Adicionar vídeo
              </button>
            )}
          </div>
        </div>

        {videos.length > 0 ? (
          <div className="space-y-2">
            {videos.map((v: any) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded" style={{ background: "rgba(0,225,255,0.04)", border: "1px solid rgba(0,225,255,0.1)" }}>
                <span style={{ color: "#ff0000" }}>▶</span>
                <span className="flex-1 font-montserrat text-sm" style={{ color: "#F2F2F2" }}>{v.title}</span>
                <span className="font-montserrat text-xs" style={{ color: "#8BA3B5" }}>{v.video_provider}</span>
                <button onClick={() => setEditingVideo({...v})} className="font-montserrat text-xs px-3 py-1 rounded border" style={{ color: "#00E1FF", borderColor: "rgba(0,225,255,0.3)" }}>Editar</button>
                <button onClick={() => setDeleteVidTarget(v)} className="font-montserrat text-xs px-3 py-1 rounded border" style={{ color: "#ff6b6b", borderColor: "rgba(255,107,107,0.3)" }}>Excluir</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>Nenhum vídeo adicionado ainda.</p>
        )}
      </div>

      <ConfirmDeleteModal isOpen={!!deleteImgTarget} title="Excluir imagem" description="Excluir esta imagem permanentemente?" loading={false}
        onConfirm={() => { if (deleteImgTarget) onDeleteImage(deleteImgTarget.id, deleteImgTarget.file_path); setDeleteImgTarget(null); }}
        onCancel={() => setDeleteImgTarget(null)} />
      <ConfirmDeleteModal isOpen={!!deleteVidTarget} title="Excluir vídeo" description={`Excluir o vídeo "${deleteVidTarget?.title}"?`} loading={false}
        onConfirm={() => { if (deleteVidTarget) onDeleteVideo(deleteVidTarget.id); setDeleteVidTarget(null); }}
        onCancel={() => setDeleteVidTarget(null)} />
    </div>
  );
}

function PdfsSection({ pdfs, onUpload, onDelete }: any) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"mapa" | "relatorio">("mapa");
  const [file, setFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const mapas = pdfs.filter((p: any) => p.category === "mapa");
  const relatorios = pdfs.filter((p: any) => p.category === "relatorio");

  async function handleUpload() {
    if (!file || !title) return;
    await onUpload(file, title, category);
    setTitle(""); setFile(null);
  }

  function PdfList({ items }: { items: any[] }) {
    return items.length > 0 ? (
      <div className="space-y-2">
        {items.map((p: any) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded" style={{ background: "rgba(0,225,255,0.04)", border: "1px solid rgba(0,225,255,0.1)" }}>
            <span style={{ color: "#ff4444" }}>📄</span>
            <span className="flex-1 font-montserrat text-sm" style={{ color: "#F2F2F2" }}>{p.title}</span>
            <button onClick={() => setDeleteTarget(p)} className="font-montserrat text-xs px-3 py-1 rounded border" style={{ color: "#ff6b6b", borderColor: "rgba(255,107,107,0.3)" }}>Excluir</button>
          </div>
        ))}
      </div>
    ) : <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>Nenhum PDF nesta categoria.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="atlas-card p-5 max-w-2xl">
        <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E1FF" }}>Adicionar PDF</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div><label className="atlas-label">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="atlas-input" placeholder="Ex: Mapa de declividade" /></div>
          <div><label className="atlas-label">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="atlas-input">
              <option value="mapa">Mapa do imóvel</option>
              <option value="relatorio">Relatório / Extra</option>
            </select></div>
          <div><label className="atlas-label">Arquivo PDF</label>
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="atlas-input" style={{ paddingTop: "7px" }} /></div>
        </div>
        <button onClick={handleUpload} className="btn-atlas-primary" disabled={!file || !title}>Enviar PDF</button>
      </div>

      {/* Mapas */}
      <div>
        <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-3" style={{ color: "#00E6FF" }}>Mapas do Imóvel</h3>
        <PdfList items={mapas} />
      </div>

      {/* Relatórios */}
      <div>
        <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-3" style={{ color: "#00E6FF" }}>Relatórios e Extras</h3>
        <PdfList items={relatorios} />
      </div>

      <ConfirmDeleteModal isOpen={!!deleteTarget} title="Excluir PDF" description={`Excluir o arquivo "${deleteTarget?.title}"?`} loading={false}
        onConfirm={() => { if (deleteTarget) onDelete(deleteTarget.id, deleteTarget.file_path); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

