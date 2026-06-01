"use client";

import { useState } from "react";
import Link from "next/link";
import { formatHa, formatAlq, formatPct, getYouTubeId } from "@/lib/utils";

const TABS = [
  "Visão Geral", "Modelo 3D", "Modelo 2D",
  "Quadro de Áreas", "Documentação", "Imagens e Vídeos", "PDFs Técnicos"
];

const DOC_LABELS: Record<string, string> = {
  matricula: "Matrícula", ccir: "CCIR", cib: "CIB", sigef: "SIGEF", car: "CAR"
};

export function FarmDetailClient({ farm, models, areaRows, docNumbers, docFiles, images, videos, pdfs }: any) {
  const [activeTab, setActiveTab] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const model3d = models.find((m: any) => m.type === "3d");
  const model2d = models.find((m: any) => m.type === "2d");
  const mapas = pdfs.filter((p: any) => p.category === "mapa");
  const relatorios = pdfs.filter((p: any) => p.category === "relatorio");

  async function getSignedUrl(bucket: string, path: string) {
    const res = await fetch("/api/admin/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, path }),
    });
    const data = await res.json();
    return data.signedUrl;
  }

  async function openFile(bucket: string, path: string) {
    const url = await getSignedUrl(bucket, path);
    if (url) window.open(url, "_blank");
  }

  async function downloadFile(bucket: string, path: string, filename: string) {
    const url = await getSignedUrl(bucket, path);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 font-montserrat text-sm">
        <Link href="/client" style={{ color: "#8BA3B5" }}>Minhas Fazendas</Link>
        <span style={{ color: "#8BA3B5" }}>→</span>
        <span style={{ color: "#00E1FF" }}>{farm.name}</span>
      </div>

      {/* Header da fazenda */}
      <div className="atlas-card p-6 mb-6" style={{ borderColor: "rgba(0,225,255,0.25)" }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-orbitron font-bold text-2xl mb-1" style={{ color: "#F2F2F2" }}>
              {farm.name}
            </h1>
            <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
              {farm.city}, {farm.state}
            </p>
            {farm.description && (
              <p className="font-montserrat text-sm mt-2" style={{ color: "rgba(139,163,181,0.8)" }}>
                {farm.description}
              </p>
            )}
          </div>
          <div className="flex gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="font-orbitron font-bold text-xl" style={{ color: "#FFA23A" }}>
                {formatHa(farm.total_area_ha)}
              </p>
              <p className="font-montserrat text-xs uppercase tracking-widest mt-0.5" style={{ color: "#8BA3B5" }}>hectares</p>
            </div>
            <div className="text-center">
              <p className="font-orbitron font-bold text-xl" style={{ color: "#FFA23A" }}>
                {formatAlq(farm.total_area_alq)}
              </p>
              <p className="font-montserrat text-xs uppercase tracking-widest mt-0.5" style={{ color: "#8BA3B5" }}>alqueires</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-0 mb-6" style={{ borderBottom: "1px solid rgba(0,225,255,0.12)" }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} className={`atlas-tab ${activeTab === i ? "active" : ""}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Visão Geral ─────────────────────────────────────────── */}
      {activeTab === 0 && (
        <div className="animate-slide-up">
          <h2 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-5" style={{ color: "#00E1FF" }}>
            Materiais Disponíveis
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { tab: 1, label: "Modelo 3D", available: !!model3d, icon: "🗺️" },
              { tab: 2, label: "Modelo 2D", available: !!model2d, icon: "📐" },
              { tab: 3, label: "Quadro de Áreas", available: areaRows.length > 0, icon: "📊" },
              { tab: 4, label: "Documentação", available: docNumbers.length > 0 || docFiles.length > 0, icon: "📋" },
              { tab: 5, label: "Imagens e Vídeos", available: images.length > 0 || videos.length > 0, icon: "📸" },
              { tab: 6, label: "PDFs Técnicos", available: pdfs.length > 0, icon: "📄" },
            ].map(({ tab, label, available, icon }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="atlas-card p-4 text-left transition-all hover:scale-[1.01]"
                style={{ opacity: available ? 1 : 0.5 }}
              >
                <span className="text-2xl block mb-2">{icon}</span>
                <p className="font-montserrat font-semibold text-sm" style={{ color: "#F2F2F2" }}>{label}</p>
                <p className="font-montserrat text-xs mt-1" style={{ color: available ? "#00E1FF" : "#8BA3B5" }}>
                  {available ? "Disponível →" : "Não disponível"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 1 & 2: Modelos Cesium ─────────────────────────────────── */}
      {(activeTab === 1 || activeTab === 2) && (() => {
        const model = activeTab === 1 ? model3d : model2d;
        const label = activeTab === 1 ? "3D" : "2D";
        return (
          <div className="animate-slide-up">
            <h2 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-5" style={{ color: "#00E1FF" }}>
              Modelo {label} — {model?.title || "Visualização"}
            </h2>
            {model ? (
              <div>
                <div
                  className="rounded-lg overflow-hidden mb-3"
                  style={{ border: "1px solid rgba(0,225,255,0.2)", aspectRatio: "16/9", background: "#0D1E2C" }}
                >
                  <iframe
                    src={model.cesium_url}
                    className="w-full h-full"
                    allowFullScreen
                    title={`Modelo ${label}`}
                    style={{ border: "none" }}
                  />
                </div>
                <a
                  href={model.cesium_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-atlas-outline inline-flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Abrir em tela cheia
                </a>
              </div>
            ) : (
              <div className="atlas-card p-12 text-center">
                <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
                  Modelo {label} não disponível ainda.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Tab 3: Quadro de Áreas ─────────────────────────────────────── */}
      {activeTab === 3 && (
        <div className="animate-slide-up">
          <h2 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-5" style={{ color: "#00E1FF" }}>
            Quadro de Áreas
          </h2>
          {areaRows.length > 0 ? (
            <>
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="atlas-card p-4 text-center">
                  <p className="font-orbitron font-bold text-xl" style={{ color: "#FFA23A" }}>
                    {formatHa(farm.total_area_ha)}
                  </p>
                  <p className="font-montserrat text-xs uppercase tracking-widest mt-1" style={{ color: "#8BA3B5" }}>
                    hectares total
                  </p>
                </div>
                <div className="atlas-card p-4 text-center">
                  <p className="font-orbitron font-bold text-xl" style={{ color: "#FFA23A" }}>
                    {formatAlq(farm.total_area_alq)}
                  </p>
                  <p className="font-montserrat text-xs uppercase tracking-widest mt-1" style={{ color: "#8BA3B5" }}>
                    alqueires total
                  </p>
                </div>
                <div className="atlas-card p-4 text-center">
                  <p className="font-orbitron font-bold text-xl" style={{ color: "#00E1FF" }}>
                    {areaRows.length}
                  </p>
                  <p className="font-montserrat text-xs uppercase tracking-widest mt-1" style={{ color: "#8BA3B5" }}>
                    classes
                  </p>
                </div>
              </div>

              <div className="atlas-card overflow-hidden">
                <div className="table-wrap">
                  <table className="atlas-table">
                    <thead><tr>
                      <th>Classe / Categoria</th>
                      <th>Área (ha)</th>
                      <th>Área (alq)</th>
                      <th>%</th>
                    </tr></thead>
                    <tbody>
                      {areaRows.map((row: any) => (
                        <tr key={row.id}>
                          <td style={{ color: "#F2F2F2" }}>{row.class_name}</td>
                          <td style={{ color: "#FFA23A" }}>{formatHa(row.area_ha)}</td>
                          <td style={{ color: "#8BA3B5" }}>{formatAlq(row.area_alq)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 rounded-full flex-1 max-w-16" style={{ background: "rgba(0,225,255,0.1)" }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.min(row.percentage, 100)}%`, background: "#00E1FF" }}/>
                              </div>
                              <span style={{ color: "#00E1FF" }}>{formatPct(row.percentage)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="atlas-card p-12 text-center">
              <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>
                Quadro de áreas não disponível ainda.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Documentação ────────────────────────────────────────── */}
      {activeTab === 4 && (
        <div className="animate-slide-up space-y-8">
          {/* Dados documentais */}
          {docNumbers.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E1FF" }}>
                Dados Documentais da Propriedade
              </h3>
              <div className="atlas-card overflow-hidden max-w-lg">
                <div className="table-wrap">
                  <table className="atlas-table">
                    <thead><tr><th>Documento</th><th>Número / Código</th></tr></thead>
                    <tbody>
                      {docNumbers.map((d: any) => (
                        <tr key={d.id}>
                          <td style={{ color: "#8BA3B5" }}>{DOC_LABELS[d.document_type] || d.document_type}</td>
                          <td>
                            <code className="font-montserrat text-sm px-2 py-0.5 rounded" style={{ background: "rgba(0,225,255,0.07)", color: "#00E1FF" }}>
                              {d.document_number}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Arquivos */}
          {docFiles.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E1FF" }}>
                Arquivos dos Documentos
              </h3>
              <div className="space-y-2">
                {docFiles.map((f: any) => (
                  <PdfItem
                    key={f.id}
                    title={f.title}
                    subtitle={DOC_LABELS[f.document_type] || f.document_type}
                    onView={() => openFile("farm-documents", f.file_path)}
                    onDownload={() => downloadFile("farm-documents", f.file_path, f.title + ".pdf")}
                  />
                ))}
              </div>
            </div>
          )}

          {docNumbers.length === 0 && docFiles.length === 0 && (
            <div className="atlas-card p-12 text-center">
              <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>Documentação não disponível ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 5: Imagens e Vídeos ────────────────────────────────────── */}
      {activeTab === 5 && (
        <div className="animate-slide-up space-y-8">
          {images.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E1FF" }}>
                Imagens
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img: any) => (
                  <div
                    key={img.id}
                    className="relative group cursor-pointer rounded overflow-hidden"
                    style={{ border: "1px solid rgba(0,225,255,0.15)", aspectRatio: "4/3", background: "#0D1E2C" }}
                    onClick={() => openFile("farm-images", img.file_path)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#8BA3B5" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <span className="font-montserrat text-xs font-600" style={{ color: "#00E1FF" }}>Visualizar</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E1FF" }}>
                Vídeos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {videos.map((v: any) => {
                  const ytId = getYouTubeId(v.video_url);
                  return (
                    <div key={v.id} className="atlas-card overflow-hidden">
                      {ytId ? (
                        <div style={{ aspectRatio: "16/9" }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            className="w-full h-full"
                            allowFullScreen
                            title={v.title}
                            style={{ border: "none" }}
                          />
                        </div>
                      ) : (
                        <div className="p-4 flex items-center gap-3" style={{ background: "rgba(0,225,255,0.04)" }}>
                          <span style={{ color: "#ff0000", fontSize: "24px" }}>▶</span>
                          <a href={v.video_url} target="_blank" rel="noopener noreferrer" style={{ color: "#00E1FF" }}>
                            {v.title}
                          </a>
                        </div>
                      )}
                      <div className="p-3 flex items-center justify-between">
                        <p className="font-montserrat text-sm font-semibold" style={{ color: "#F2F2F2" }}>{v.title}</p>
                        <a href={v.video_url} target="_blank" rel="noopener noreferrer"
                          className="font-montserrat text-xs font-600" style={{ color: "#00E1FF" }}>
                          Abrir ↗
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {images.length === 0 && videos.length === 0 && (
            <div className="atlas-card p-12 text-center">
              <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>Nenhuma mídia disponível ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 6: PDFs Técnicos ───────────────────────────────────────── */}
      {activeTab === 6 && (
        <div className="animate-slide-up space-y-8">
          {mapas.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#FFA23A" }}>
                Mapas do Imóvel
              </h3>
              <div className="space-y-2">
                {mapas.map((p: any) => (
                  <PdfItem key={p.id} title={p.title}
                    onView={() => openFile("farm-documents", p.file_path)}
                    onDownload={() => downloadFile("farm-documents", p.file_path, p.title + ".pdf")} />
                ))}
              </div>
            </div>
          )}

          {relatorios.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#FFA23A" }}>
                Relatórios e Extras
              </h3>
              <div className="space-y-2">
                {relatorios.map((p: any) => (
                  <PdfItem key={p.id} title={p.title}
                    onView={() => openFile("farm-documents", p.file_path)}
                    onDownload={() => downloadFile("farm-documents", p.file_path, p.title + ".pdf")} />
                ))}
              </div>
            </div>
          )}

          {pdfs.length === 0 && (
            <div className="atlas-card p-12 text-center">
              <p className="font-montserrat text-sm" style={{ color: "#8BA3B5" }}>Nenhum PDF técnico disponível ainda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PdfItem({ title, subtitle, onView, onDownload }: {
  title: string; subtitle?: string;
  onView: () => void; onDownload: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg transition-colors"
      style={{ background: "rgba(0,225,255,0.03)", border: "1px solid rgba(0,225,255,0.1)" }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.2)" }}>
        <span style={{ fontSize: "18px" }}>📄</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-montserrat font-semibold text-sm truncate" style={{ color: "#F2F2F2" }}>{title}</p>
        {subtitle && <p className="font-montserrat text-xs" style={{ color: "#8BA3B5" }}>{subtitle}</p>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onView} className="btn-atlas-outline text-xs px-3 py-2">
          Visualizar
        </button>
        <button onClick={onDownload} className="font-montserrat text-xs px-3 py-2 rounded border transition-colors"
          style={{ color: "#FFA23A", borderColor: "rgba(255,162,58,0.3)" }}>
          Download
        </button>
      </div>
    </div>
  );
}
