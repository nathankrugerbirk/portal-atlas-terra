"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/Toast";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { formatHa, formatAlq, haToAlq } from "@/lib/utils";

const SECTION_TABS = [
  "Dados Principais", "Modelo 3D", "Modelo 2D", "Quadro de Áreas",
  "Documentação", "Imagens e Vídeos", "PDFs Técnicos"
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

      {/* Section 0: Dados Principais */}
      {activeTab === 0 && <FarmBasicDataSection farm={farm} supabase={supabase} showToast={showToast} />}

      {/* Section 1: Modelo 3D */}
      {activeTab === 1 && <ModelSection type="3d" model={getModel("3d")} onSave={(u, t) => saveModel("3d", u, t)} />}

      {/* Section 2: Modelo 2D */}
      {activeTab === 2 && <ModelSection type="2d" model={getModel("2d")} onSave={(u, t) => saveModel("2d", u, t)} />}

      {/* Section 3: Quadro de Áreas */}
      {activeTab === 3 && <AreaTableSection rows={areaRows} onSave={saveAreaRow} onDelete={deleteAreaRow} />}

      {/* Section 4: Documentação */}
      {activeTab === 4 && (
        <DocumentationSection
          farmId={farm.id}
          docNumbers={docNumbers}
          docFiles={docFiles}
          supabase={supabase}
          showToast={showToast}
          onDocNumbersChange={setDocNumbers}
          onUpload={uploadDocFile}
          onDeleteFile={deleteDocFile}
        />
      )}

      {/* Section 5: Imagens e Vídeos */}
      {activeTab === 5 && (
        <ImagesVideosSection
          images={images}
          videos={videos}
          onUploadImage={uploadImage}
          onDeleteImage={deleteImage}
          onSaveVideo={saveVideo}
          onDeleteVideo={deleteVideo}
        />
      )}

      {/* Section 6: PDFs Técnicos */}
      {activeTab === 6 && (
        <PdfsSection pdfs={pdfs} onUpload={uploadPdf} onDelete={deletePdf} />
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

  return (
    <div className="atlas-card p-6 max-w-lg">
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

function AreaTableSection({ rows, onSave, onDelete }: any) {
  const [editingRow, setEditingRow] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class_name: "", area_ha: "", area_alq: "", percentage: "" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function startEdit(row: any) {
    setForm({ class_name: row.class_name, area_ha: row.area_ha, area_alq: row.area_alq, percentage: row.percentage });
    setEditingRow(row); setShowForm(true);
  }

  function startNew() {
    setForm({ class_name: "", area_ha: "", area_alq: "", percentage: "" });
    setEditingRow(null); setShowForm(true);
  }

  async function handleSave() {
    await onSave({
      id: editingRow?.id, class_name: form.class_name,
      area_ha: parseFloat(form.area_ha), area_alq: parseFloat(form.area_alq),
      percentage: parseFloat(form.percentage)
    });
    setShowForm(false);
  }

  const totalHa = rows.reduce((s: number, r: any) => s + r.area_ha, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest" style={{ color: "#00E1FF" }}>Quadro de Áreas</h3>
        <button onClick={startNew} className="btn-atlas-primary text-sm px-4 py-2">+ Adicionar linha</button>
      </div>

      {showForm && (
        <div className="atlas-card p-5 mb-5 max-w-lg animate-slide-up">
          <h4 className="font-montserrat font-semibold text-sm mb-4" style={{ color: "#F2F2F2" }}>
            {editingRow ? "Editar linha" : "Nova linha"}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="atlas-label">Classe / Categoria</label>
              <input value={form.class_name} onChange={(e) => setForm(p => ({...p, class_name: e.target.value}))} className="atlas-input" placeholder="Ex: Pastagem" /></div>
            <div><label className="atlas-label">Área (ha)</label>
              <input type="number" step="0.01" value={form.area_ha} onChange={(e) => setForm(p => ({...p, area_ha: e.target.value}))} className="atlas-input" /></div>
            <div><label className="atlas-label">Área (alq)</label>
              <input type="number" step="0.01" value={form.area_alq} onChange={(e) => setForm(p => ({...p, area_alq: e.target.value}))} className="atlas-input" /></div>
            <div><label className="atlas-label">Percentual (%)</label>
              <input type="number" step="0.1" value={form.percentage} onChange={(e) => setForm(p => ({...p, percentage: e.target.value}))} className="atlas-input" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} className="btn-atlas-primary">Salvar</button>
            <button onClick={() => setShowForm(false)} className="btn-atlas-outline">Cancelar</button>
          </div>
        </div>
      )}

      {rows.length > 0 ? (
        <div className="atlas-card overflow-hidden">
          <div className="table-wrap">
            <table className="atlas-table">
              <thead><tr>
                <th>Classe</th><th>Área (ha)</th><th>Área (alq)</th><th>%</th><th>Ações</th>
              </tr></thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={row.id}>
                    <td style={{ color: "#F2F2F2" }}>{row.class_name}</td>
                    <td style={{ color: "#00E6FF" }}>{row.area_ha}</td>
                    <td style={{ color: "#8BA3B5" }}>{row.area_alq}</td>
                    <td style={{ color: "#00E1FF" }}>{row.percentage}%</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(row)} className="font-montserrat text-xs px-3 py-1 rounded border" style={{ color: "#00E1FF", borderColor: "rgba(0,225,255,0.3)" }}>Editar</button>
                        <button onClick={() => setDeleteTarget(row.id)} className="font-montserrat text-xs px-3 py-1 rounded border" style={{ color: "#ff6b6b", borderColor: "rgba(255,107,107,0.3)" }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: "rgba(0,225,255,0.04)" }}>
                  <td className="font-semibold" style={{ color: "#00E1FF" }}>TOTAL</td>
                  <td className="font-semibold" style={{ color: "#00E6FF" }}>{totalHa.toFixed(2)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="atlas-card p-8 text-center font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
          Nenhuma linha cadastrada. Clique em "+ Adicionar linha" para começar.
        </div>
      )}

      <ConfirmDeleteModal isOpen={!!deleteTarget} title="Excluir linha"
        description="Excluir esta linha do quadro de áreas?" loading={false}
        onConfirm={() => { if (deleteTarget) onDelete(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)} />
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

