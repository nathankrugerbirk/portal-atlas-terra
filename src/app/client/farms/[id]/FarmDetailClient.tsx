"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatHa, formatAlq, formatPct, getYouTubeId } from "@/lib/utils";

const TABS = [
  "Visão Geral", "Modelo 3D", "Quadro de Áreas",
  "Mapas", "Imagens e Vídeos", "Documentação", "Compartilhar"
];

/* ── Paleta de cores para o gráfico — tonalidades bem distintas ── */
const CHART_COLORS = [
  "#00E6FF", // ciano puro
  "#0066AA", // azul médio
  "#00FFCC", // verde-água
  "#003388", // azul escuro
  "#44DDFF", // ciano claro
  "#0044CC", // azul royal
  "#00AA88", // verde-mar
  "#5599FF", // azul lavanda
  "#009977", // verde petróleo
  "#0088DD", // azul celeste
  "#00CC99", // esmeralda
  "#2255BB", // índigo
];

/* ── Gráfico de pizza SVG ── */
function PieChart({ rows, totalHa }: { rows: any[]; totalHa: number }) {
  if (rows.length === 0 || totalHa === 0) return null;
  const cx = 110; const cy = 110; const r = 90;
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
    return { x1, y1, x2, y2, largeArc, pct, color: CHART_COLORS[i % CHART_COLORS.length], label: row.class_name, ha: row.area_ha || 0 };
  });
  return (
    <div style={{ marginTop: 28 }}>
      <h4 style={{ fontFamily: "var(--font-main)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8B949E", marginBottom: 16 }}>
        Distribuição por Classe
      </h4>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 28 }}>
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r + 7} fill="none" stroke="rgba(0,230,255,0.07)" strokeWidth="1" />
          {slices.map((s, i) => (
            <g key={i}>
              <path d={`M ${cx},${cy} L ${s.x1},${s.y1} A ${r},${r} 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
                fill={s.color} opacity="0.88"
                style={{ filter: `drop-shadow(0 0 3px ${s.color}50)` }} />
              <path d={`M ${cx},${cy} L ${s.x1},${s.y1} A ${r},${r} 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
                fill="none" stroke="rgba(13,17,23,0.5)" strokeWidth="1.5" />
            </g>
          ))}
          <circle cx={cx} cy={cy} r={r * 0.4} fill="#0D1117" />
          <circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke="rgba(0,230,255,0.1)" strokeWidth="1" />
          <text x={cx} y={cy - 7} textAnchor="middle" fill="#00E6FF"
            style={{ fontFamily: "var(--font-main)", fontSize: "12px", fontWeight: 700 }}>{rows.length}</text>
          <text x={cx} y={cy + 9} textAnchor="middle" fill="#8B949E"
            style={{ fontFamily: "var(--font-main)", fontSize: "8px", letterSpacing: "0.08em" }}>CLASSES</text>
        </svg>
        <div style={{ flex: 1, minWidth: 150, display: "flex", flexDirection: "column", gap: 7 }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, flexShrink: 0, boxShadow: `0 0 5px ${s.color}60` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-main)", fontSize: "0.8rem", color: "#F6F8FA", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</p>
                <p style={{ fontFamily: "var(--font-main)", fontSize: "0.68rem", color: "#8B949E" }}>
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

const DOC_LABELS: Record<string, string> = {
  matricula: "Matrícula", ccir: "CCIR", cib: "CIB", sigef: "SIGEF", car: "CAR"
};

/* ─── Utilitário: busca URL assinada ────────────────────────────────── */
async function fetchSignedUrl(bucket: string, path: string): Promise<string | null> {
  try {
    const res = await fetch("/api/admin/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, path }),
    });
    const data = await res.json();
    return data.signedUrl ?? null;
  } catch {
    return null;
  }
}

/* ─── Download forçado ──────────────────────────────────────────────── */
async function triggerDownload(bucket: string, path: string, filename: string) {
  const url = await fetchSignedUrl(bucket, path);
  if (!url) return;
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}

/* ─── Componente: thumbnail de imagem ──────────────────────────────── */
function ImageCard({ img, onOpenLightbox, onUrlReady }: {
  img: any;
  onOpenLightbox: (url: string) => void;
  onUrlReady?: (url: string) => void;
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchSignedUrl("farm-images", img.file_path).then((url) => {
      setThumbUrl(url);
      if (url && onUrlReady) onUrlReady(url);
    });
  }, [img.file_path]);

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    setDownloading(true);
    await triggerDownload("farm-images", img.file_path, (img.title || "imagem") + "." + img.file_path.split(".").pop());
    setDownloading(false);
  }

  return (
    <div
      className="relative group rounded-lg overflow-hidden"
      style={{
        border: "1px solid rgba(0,200,217,0.15)",
        aspectRatio: "4/3",
        background: "#111820",
        cursor: thumbUrl ? "pointer" : "default",
      }}
    >
      {thumbUrl ? (
        <>
          {/* Thumbnail */}
          <img
            src={thumbUrl}
            alt={img.title || "Imagem"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onClick={() => onOpenLightbox(thumbUrl)}
          />

          {/* Overlay hover */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: "rgba(6,14,24,0.75)" }}
          >
            {/* Botão visualizar */}
            <button
              onClick={() => onOpenLightbox(thumbUrl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-montserrat text-xs font-600 transition-all"
              style={{
                background: "rgba(0,200,217,0.15)",
                border: "1px solid rgba(0,200,217,0.4)",
                color: "#00C8D9",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Visualizar
            </button>

            {/* Botão download */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-montserrat text-xs font-600 transition-all"
              style={{
                background: "rgba(0,230,255,0.08)",
                border: "1px solid rgba(0,230,255,0.3)",
                color: "#00E6FF",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {downloading ? "Baixando..." : "Download"}
            </button>
          </div>

          {/* Título */}
          {img.title && (
            <div
              className="absolute bottom-0 left-0 right-0 px-3 py-2 font-montserrat text-xs truncate"
              style={{ background: "rgba(6,14,24,0.85)", color: "rgba(255,255,255,0.7)" }}
            >
              {img.title}
            </div>
          )}
        </>
      ) : (
        /* Skeleton enquanto carrega */
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "#6B7280" }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
        </div>
      )}
    </div>
  );
}

/* ─── Lightbox de imagem com navegação ─────────────────────────────── */
function ImageLightbox({
  images, currentIndex, onClose, onNavigate,
}: {
  images: { url: string; title: string }[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const current = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(currentIndex + 1);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, hasPrev, hasNext, onClose, onNavigate]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
      style={{ background: "rgba(6,14,24,0.97)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full animate-fade-in"
        style={{ maxWidth: "90vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <p style={{ fontFamily: "var(--font-main)", fontSize: "0.9rem", fontWeight: 600, color: "#F6F8FA" }}>
              {current.title}
            </p>
            {images.length > 1 && (
              <span style={{ fontFamily: "var(--font-main)", fontSize: "0.7rem", color: "#8B949E", background: "rgba(139,148,158,0.1)", border: "1px solid rgba(139,148,158,0.2)", borderRadius: 4, padding: "2px 8px" }}>
                {currentIndex + 1} / {images.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 font-montserrat text-xs px-3 py-1.5 rounded transition-colors"
            style={{ color: "#6B7280", border: "1px solid rgba(107,114,128,0.3)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Fechar
          </button>
        </div>

        {/* Área principal: setas + imagem */}
        <div className="flex items-center gap-3">
          {/* Botão anterior */}
          <button
            onClick={() => hasPrev && onNavigate(currentIndex - 1)}
            disabled={!hasPrev}
            style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: hasPrev ? "rgba(0,230,255,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${hasPrev ? "rgba(0,230,255,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: hasPrev ? "#00E6FF" : "#3A3F44",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: hasPrev ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          {/* Imagem */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <img
              key={current.url}
              src={current.url}
              alt={current.title}
              className="w-full rounded-lg animate-fade-in"
              style={{
                maxHeight: "78vh",
                objectFit: "contain",
                border: "1px solid rgba(0,230,255,0.15)",
                boxShadow: "0 0 60px rgba(0,230,255,0.06)",
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>

          {/* Botão próximo */}
          <button
            onClick={() => hasNext && onNavigate(currentIndex + 1)}
            disabled={!hasNext}
            style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: hasNext ? "rgba(0,230,255,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${hasNext ? "rgba(0,230,255,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: hasNext ? "#00E6FF" : "#3A3F44",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: hasNext ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Miniaturas de navegação (se houver mais de 1) */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => onNavigate(i)}
                style={{
                  width: 8, height: 8, borderRadius: "50%", padding: 0, border: "none",
                  background: i === currentIndex ? "#00E6FF" : "rgba(139,148,158,0.35)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  transform: i === currentIndex ? "scale(1.3)" : "scale(1)",
                }}
              />
            ))}
          </div>
        )}

        <p className="text-center mt-3" style={{ fontFamily: "var(--font-main)", fontSize: "0.65rem", color: "rgba(139,148,158,0.4)" }}>
          ← → para navegar · ESC para fechar
        </p>
      </div>
    </div>
  );
}

/* ─── Visualizador de PDF inline ────────────────────────────────────── */
function PdfViewer({ title, onClose, bucket, path }: {
  title: string;
  onClose: () => void;
  bucket: string;
  path: string;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSignedUrl(bucket, path).then((url) => {
      setPdfUrl(url);
      setLoading(false);
    });
  }, [bucket, path]);

  // ESC via window (funciona mesmo quando o iframe tem foco)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleDownload() {
    setDownloading(true);
    await triggerDownload(bucket, path, title + ".pdf");
    setDownloading(false);
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      className="fixed inset-0 z-50 flex flex-col outline-none"
      style={{ background: "rgba(6,14,24,0.98)", backdropFilter: "blur(8px)" }}
    >
      {/* Barra superior */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(0,200,217,0.12)", background: "#0A1A26" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p className="font-montserrat font-semibold text-sm" style={{ color: "#FFFFFF" }}>{title}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading || !pdfUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-montserrat text-xs font-semibold transition-all"
            style={{
              background: "rgba(0,230,255,0.08)",
              border: "1px solid rgba(0,230,255,0.3)",
              color: "#00E6FF",
              cursor: downloading || !pdfUrl ? "not-allowed" : "pointer",
              opacity: !pdfUrl ? 0.5 : 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {downloading ? "Baixando..." : "Download"}
          </button>

          {/* Fechar */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-montserrat text-xs transition-colors"
            style={{ color: "#6B7280", border: "1px solid rgba(107,114,128,0.3)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Fechar · ESC
          </button>
        </div>
      </div>

      {/* Área do PDF */}
      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="animate-spin mx-auto mb-3" width="32" height="32" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#00C8D9" strokeWidth="4"/>
                <path className="opacity-75" fill="#00C8D9" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="font-montserrat text-sm" style={{ color: "#6B7280" }}>Carregando documento...</p>
            </div>
          </div>
        )}

        {!loading && pdfUrl && (
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            style={{ border: "none" }}
            title={title}
          />
        )}

        {!loading && !pdfUrl && (
          <div className="h-full flex items-center justify-center">
            <p className="font-montserrat text-sm" style={{ color: "#6B7280" }}>
              Não foi possível carregar o documento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Item de PDF na lista ──────────────────────────────────────────── */
function PdfItem({ title, subtitle, onView, onDownload, downloading }: {
  title: string;
  subtitle?: string;
  onView: () => void;
  onDownload: () => void;
  downloading?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-lg transition-colors"
      style={{ background: "rgba(0,200,217,0.03)", border: "1px solid rgba(0,200,217,0.1)" }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.2)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-montserrat font-semibold text-sm truncate" style={{ color: "#FFFFFF" }}>{title}</p>
        {subtitle && (
          <p className="font-montserrat text-xs mt-0.5" style={{ color: "#6B7280" }}>{subtitle}</p>
        )}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded font-montserrat text-xs font-semibold transition-all"
          style={{
            background: "rgba(0,200,217,0.08)",
            border: "1px solid rgba(0,200,217,0.3)",
            color: "#00C8D9",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Visualizar
        </button>

        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded font-montserrat text-xs font-semibold transition-all"
          style={{
            background: "rgba(0,230,255,0.06)",
            border: "1px solid rgba(0,230,255,0.25)",
            color: "#00E6FF",
            cursor: downloading ? "not-allowed" : "pointer",
            opacity: downloading ? 0.6 : 1,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {downloading ? "Baixando..." : "Download"}
        </button>
      </div>
    </div>
  );
}

/* ─── Componente principal ──────────────────────────────────────────── */
export function FarmDetailClient({ farm, models, areaRows, docNumbers, docFiles, images, videos, pdfs }: any) {
  const [activeTab, setActiveTab] = useState(0);

  // Lightbox de imagem com navegação
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImages, setLightboxImages] = useState<{ url: string; title: string }[]>([]);

  // Visualizador de PDF
  const [pdfViewer, setPdfViewer] = useState<{
    title: string; bucket: string; path: string;
  } | null>(null);

  // Download state por item (key = id)
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const model3d = models.find((m: any) => m.type === "3d");
  const mapas = pdfs.filter((p: any) => p.category === "mapa");
  const relatorios = pdfs.filter((p: any) => p.category === "relatorio");

  async function handleDownloadPdf(id: string, bucket: string, path: string, title: string) {
    setDownloading((prev) => ({ ...prev, [id]: true }));
    await triggerDownload(bucket, path, title + ".pdf");
    setDownloading((prev) => ({ ...prev, [id]: false }));
  }

  return (
    <div className="animate-fade-in">

      {/* Lightbox de imagem com navegação */}
      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {/* Visualizador de PDF */}
      {pdfViewer && (
        <PdfViewer
          title={pdfViewer.title}
          bucket={pdfViewer.bucket}
          path={pdfViewer.path}
          onClose={() => setPdfViewer(null)}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 font-montserrat text-sm">
        <Link href="/client" style={{ color: "#6B7280" }}>Minhas Fazendas</Link>
        <span style={{ color: "#6B7280" }}>→</span>
        <span style={{ color: "#00C8D9" }}>{farm.name}</span>
      </div>

      {/* Header da fazenda */}
      <div className="atlas-card p-6 mb-6" style={{ borderColor: "rgba(0,200,217,0.25)" }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-orbitron font-bold text-2xl mb-1" style={{ color: "#FFFFFF" }}>
              {farm.name}
            </h1>
            <p className="font-montserrat text-sm" style={{ color: "#6B7280" }}>
              {farm.city}, {farm.state}
            </p>
            {farm.description && (
              <p className="font-montserrat text-sm mt-2" style={{ color: "rgba(107,114,128,0.8)" }}>
                {farm.description}
              </p>
            )}
          </div>
          <div className="flex gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="font-orbitron font-bold text-xl" style={{ color: "#00E6FF" }}>
                {formatHa(farm.total_area_ha)}
              </p>
              <p className="font-montserrat text-xs uppercase tracking-widest mt-0.5" style={{ color: "#6B7280" }}>hectares</p>
            </div>
            <div className="text-center">
              <p className="font-orbitron font-bold text-xl" style={{ color: "#00E6FF" }}>
                {formatAlq(farm.total_area_ha / 2.42)}
              </p>
              <p className="font-montserrat text-xs uppercase tracking-widest mt-0.5" style={{ color: "#6B7280" }}>alqueires</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-0 mb-6" style={{ borderBottom: "1px solid rgba(0,200,217,0.12)" }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} className={`atlas-tab ${activeTab === i ? "active" : ""}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Visão Geral ─────────────────────────────────────────── */}
      {activeTab === 0 && (
        <div className="animate-slide-up">
          <h2 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-5" style={{ color: "#00C8D9" }}>
            Materiais Disponíveis
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { tab: 1, label: "Modelo 3D", available: !!model3d, icon: "🗺️" },
              { tab: 2, label: "Quadro de Áreas", available: areaRows.length > 0, icon: "📊" },
              { tab: 3, label: "Mapas", available: pdfs.length > 0, icon: "📄" },
              { tab: 4, label: "Imagens e Vídeos", available: images.length > 0 || videos.length > 0, icon: "📸" },
              { tab: 5, label: "Documentação", available: docNumbers.length > 0 || docFiles.length > 0, icon: "📋" },
            ].map(({ tab, label, available, icon }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="atlas-card p-4 text-left transition-all hover:scale-[1.01]"
                style={{ opacity: available ? 1 : 0.5 }}
              >
                <span className="text-2xl block mb-2">{icon}</span>
                <p className="font-montserrat font-semibold text-sm" style={{ color: "#FFFFFF" }}>{label}</p>
                <p className="font-montserrat text-xs mt-1" style={{ color: available ? "#00C8D9" : "#6B7280" }}>
                  {available ? "Disponível →" : "Não disponível"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 1: Modelo 3D ──────────────────────────────────────────── */}
      {activeTab === 1 && (
        <div className="animate-slide-up">
          <h2 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-5" style={{ color: "#00E6FF" }}>
            Modelo 3D — {model3d?.title || "Visualização"}
          </h2>
          {model3d ? (
            <div>
              <div className="rounded-lg overflow-hidden mb-3"
                style={{ border: "1px solid rgba(0,230,255,0.2)", aspectRatio: "16/9", background: "#111820" }}>
                <iframe src={model3d.cesium_url} className="w-full h-full" allowFullScreen title="Modelo 3D" style={{ border: "none" }} />
              </div>
              <a href={model3d.cesium_url} target="_blank" rel="noopener noreferrer" className="btn-atlas-outline inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Abrir em tela cheia
              </a>
            </div>
          ) : (
            <div className="atlas-card p-12 text-center">
              <p className="font-montserrat text-sm" style={{ color: "#6B7280" }}>Modelo 3D não disponível ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Quadro de Áreas ─────────────────────────────────────── */}
      {activeTab === 2 && (() => {
        const totalHa = areaRows.reduce((sum: number, r: any) => sum + (r.area_ha || 0), 0);
        const totalAlq = totalHa / 2.42;
        return (
          <div className="animate-slide-up">
            <h2 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-5" style={{ color: "#00E6FF" }}>
              Quadro de Áreas
            </h2>
            {areaRows.length > 0 ? (
              <>
                {/* Cards de totais */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="atlas-card p-4 text-center">
                    <p className="font-orbitron font-bold text-xl" style={{ color: "#00E6FF" }}>{formatHa(totalHa)}</p>
                    <p className="font-montserrat text-xs uppercase tracking-widest mt-1" style={{ color: "#8B949E" }}>hectares total</p>
                  </div>
                  <div className="atlas-card p-4 text-center">
                    <p className="font-orbitron font-bold text-xl" style={{ color: "#00E6FF" }}>{formatAlq(totalAlq)}</p>
                    <p className="font-montserrat text-xs uppercase tracking-widest mt-1" style={{ color: "#8B949E" }}>alqueires total</p>
                  </div>
                  <div className="atlas-card p-4 text-center">
                    <p className="font-orbitron font-bold text-xl" style={{ color: "#00E6FF" }}>{areaRows.length}</p>
                    <p className="font-montserrat text-xs uppercase tracking-widest mt-1" style={{ color: "#8B949E" }}>classes</p>
                  </div>
                </div>

                {/* Tabela */}
                <div className="atlas-card overflow-hidden">
                  <div className="table-wrap">
                    <table className="atlas-table">
                      <thead>
                        <tr>
                          <th>Classe / Categoria</th>
                          <th>Área (ha)</th>
                          <th>Área (alq)</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {areaRows.map((row: any) => {
                          const alq = (row.area_ha || 0) / 2.42;
                          const pct = totalHa > 0 ? ((row.area_ha || 0) / totalHa) * 100 : 0;
                          return (
                            <tr key={row.id}>
                              <td style={{ color: "#F6F8FA" }}>{row.class_name}</td>
                              <td style={{ color: "#00E6FF", fontVariantNumeric: "tabular-nums" }}>
                                {formatHa(row.area_ha)}
                              </td>
                              <td style={{ color: "#8B949E", fontVariantNumeric: "tabular-nums" }}>
                                {formatAlq(alq)}
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 rounded-full flex-1 max-w-16" style={{ background: "rgba(0,230,255,0.1)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: "#00E6FF" }}/>
                                  </div>
                                  <span style={{ color: "#00E6FF", fontVariantNumeric: "tabular-nums", minWidth: "42px" }}>
                                    {formatPct(pct)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Linha de total */}
                      <tfoot>
                        <tr style={{ borderTop: "1px solid rgba(0,230,255,0.2)" }}>
                          <td style={{ color: "#F6F8FA", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", padding: "12px 16px" }}>
                            Total
                          </td>
                          <td style={{ color: "#00E6FF", fontWeight: 700, fontVariantNumeric: "tabular-nums", padding: "12px 16px" }}>
                            {formatHa(totalHa)}
                          </td>
                          <td style={{ color: "#8B949E", fontWeight: 600, fontVariantNumeric: "tabular-nums", padding: "12px 16px" }}>
                            {formatAlq(totalAlq)}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ color: "#00E6FF", fontWeight: 700 }}>100,0%</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Gráfico de pizza */}
                <div className="atlas-card p-5 mt-4">
                  <PieChart rows={areaRows} totalHa={totalHa} />
                </div>
              </>
            ) : (
              <div className="atlas-card p-12 text-center">
                <p className="font-montserrat text-sm" style={{ color: "#8B949E" }}>Quadro de áreas não disponível ainda.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Tab 3: Mapas ──────────────────────────────────────────────── */}
      {activeTab === 3 && (
        <div className="animate-slide-up space-y-8">
          {mapas.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E6FF" }}>
                Mapas do Imóvel
              </h3>
              <div className="space-y-2">
                {mapas.map((p: any) => (
                  <PdfItem key={p.id} title={p.title}
                    onView={() => setPdfViewer({ title: p.title, bucket: "farm-documents", path: p.file_path })}
                    onDownload={() => handleDownloadPdf(p.id, "farm-documents", p.file_path, p.title)}
                    downloading={downloading[p.id]} />
                ))}
              </div>
            </div>
          )}
          {relatorios.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E6FF" }}>
                Relatórios e Extras
              </h3>
              <div className="space-y-2">
                {relatorios.map((p: any) => (
                  <PdfItem key={p.id} title={p.title}
                    onView={() => setPdfViewer({ title: p.title, bucket: "farm-documents", path: p.file_path })}
                    onDownload={() => handleDownloadPdf(p.id, "farm-documents", p.file_path, p.title)}
                    downloading={downloading[p.id]} />
                ))}
              </div>
            </div>
          )}
          {pdfs.length === 0 && (
            <div className="atlas-card p-12 text-center">
              <p className="font-montserrat text-sm" style={{ color: "#6B7280" }}>Nenhum mapa disponível ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Imagens e Vídeos ───────────────────────────────────── */}
      {activeTab === 4 && (() => {
        // Mapa de url resolvida por índice para navegação
        const resolvedUrls: string[] = new Array(images.length).fill("");
        return (
        <div className="animate-slide-up space-y-8">
          {images.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E6FF" }}>
                Imagens ({images.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img: any, idx: number) => (
                  <ImageCard
                    key={img.id}
                    img={img}
                    onUrlReady={(url) => { resolvedUrls[idx] = url; }}
                    onOpenLightbox={(url) => {
                      resolvedUrls[idx] = url;
                      setLightboxImages(images.map((m: any, j: number) => ({
                        url: resolvedUrls[j] || url,
                        title: m.title || `Imagem ${j + 1}`,
                      })));
                      setLightboxIndex(idx);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00C8D9" }}>
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
                        <div className="p-4 flex items-center gap-3" style={{ background: "rgba(0,200,217,0.04)" }}>
                          <span style={{ color: "#ff0000", fontSize: "24px" }}>▶</span>
                          <a href={v.video_url} target="_blank" rel="noopener noreferrer" style={{ color: "#00C8D9" }}>{v.title}</a>
                        </div>
                      )}
                      <div className="p-3 flex items-center justify-between">
                        <p className="font-montserrat text-sm font-semibold" style={{ color: "#FFFFFF" }}>{v.title}</p>
                        <a href={v.video_url} target="_blank" rel="noopener noreferrer"
                          className="font-montserrat text-xs" style={{ color: "#00C8D9" }}>
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
              <p className="font-montserrat text-sm" style={{ color: "#6B7280" }}>Nenhuma mídia disponível ainda.</p>
            </div>
          )}
        </div>
        );
      })()}

      {/* ── Tab 5: Documentação ───────────────────────────────────────── */}
      {activeTab === 5 && (
        <div className="animate-slide-up space-y-8">
          {docNumbers.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E6FF" }}>
                Dados Documentais da Propriedade
              </h3>
              <div className="atlas-card overflow-hidden max-w-lg">
                <div className="table-wrap">
                  <table className="atlas-table">
                    <thead><tr><th>Documento</th><th>Número / Código</th></tr></thead>
                    <tbody>
                      {docNumbers.map((d: any) => (
                        <tr key={d.id}>
                          <td style={{ color: "#6B7280" }}>{DOC_LABELS[d.document_type] || d.document_type}</td>
                          <td>
                            <span style={{
                              fontFamily: "var(--font-main)",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: "#FFFFFF",
                              letterSpacing: "0.02em",
                            }}>
                              {d.document_number}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {docFiles.length > 0 && (
            <div>
              <h3 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#00E6FF" }}>
                Arquivos dos Documentos
              </h3>
              <div className="space-y-2">
                {docFiles.map((f: any) => (
                  <PdfItem key={f.id} title={f.title}
                    subtitle={DOC_LABELS[f.document_type] || f.document_type}
                    onView={() => setPdfViewer({ title: f.title, bucket: "farm-documents", path: f.file_path })}
                    onDownload={() => handleDownloadPdf(f.id, "farm-documents", f.file_path, f.title)}
                    downloading={downloading[f.id]} />
                ))}
              </div>
            </div>
          )}
          {docNumbers.length === 0 && docFiles.length === 0 && (
            <div className="atlas-card p-12 text-center">
              <p className="font-montserrat text-sm" style={{ color: "#6B7280" }}>Documentação não disponível ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 6: Compartilhar ────────────────────────────────────────── */}
      {activeTab === 6 && (
        <ShareTab farmId={farm.id} farmName={farm.name} />
      )}
    </div>
  );
}

/* ─── Aba de compartilhamento ───────────────────────────────────────────── */
function ShareTab({ farmId, farmName }: { farmId: string; farmName: string }) {
  const [copied, setCopied] = useState(false);
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/share/${farmId}`
    : `/share/${farmId}`;

  function copyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const waText = encodeURIComponent(`Confira esta propriedade: ${publicUrl}`);

  return (
    <div className="animate-slide-up" style={{ maxWidth: 520 }}>
      <h2 className="font-orbitron font-semibold text-sm uppercase tracking-widest mb-6"
        style={{ color: "var(--color-primary)" }}>
        Compartilhar Fazenda
      </h2>

      {/* Preview do link */}
      <div className="atlas-card p-5 mb-4" style={{ borderColor: "rgba(0,230,255,0.2)" }}>
        <p style={{ fontFamily:"var(--font-main)", fontSize:"0.65rem", fontWeight:600,
          letterSpacing:"0.1em", textTransform:"uppercase", color:"#8B949E", marginBottom:8 }}>
          Link público desta fazenda
        </p>
        <div className="flex gap-2 items-center">
          <div style={{
            flex: 1, padding: "10px 14px", borderRadius: 6,
            background: "rgba(0,230,255,0.05)", border: "1px solid rgba(0,230,255,0.15)",
            fontFamily: "monospace", fontSize: "0.78rem", color: "#00E6FF",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {publicUrl}
          </div>
        </div>
        <p style={{ fontFamily:"var(--font-main)", fontSize:"0.68rem", color:"rgba(139,148,158,0.5)", marginTop:8 }}>
          Qualquer pessoa com este link consegue visualizar a página pública desta propriedade (se o compartilhamento estiver ativo).
        </p>
      </div>

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={copyLink} className="btn-atlas-primary flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {copied ? "✓ Link Copiado!" : "Copiar Link"}
        </button>

        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"10px 20px", borderRadius:4, textDecoration:"none",
            border:"1px solid rgba(37,211,102,0.4)", background:"rgba(37,211,102,0.08)",
            color:"#25d366", fontFamily:"var(--font-main)", fontSize:"0.8rem", fontWeight:600,
            letterSpacing:"0.06em",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Compartilhar no WhatsApp
        </a>
      </div>

      {/* Preview visual */}
      <div className="atlas-card p-4" style={{ borderColor: "rgba(0,230,255,0.1)" }}>
        <p style={{ fontFamily:"var(--font-main)", fontSize:"0.65rem", fontWeight:600,
          letterSpacing:"0.1em", textTransform:"uppercase", color:"#8B949E", marginBottom:12 }}>
          Preview da página pública
        </p>
        <div style={{
          background: "#0D1117", borderRadius: 6, padding: "20px 16px",
          border: "1px solid rgba(0,230,255,0.08)",
        }}>
          <div style={{ height: 8, width: "60%", background: "rgba(0,230,255,0.15)", borderRadius: 4, marginBottom: 8 }}/>
          <div style={{ height: 6, width: "40%", background: "rgba(139,148,158,0.2)", borderRadius: 4, marginBottom: 16 }}/>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {[1,2].map(i => (
              <div key={i} style={{ flex:1, height:52, background:"rgba(0,230,255,0.06)",
                borderRadius:6, border:"1px solid rgba(0,230,255,0.1)" }}/>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ aspectRatio:"4/3", background:"rgba(0,230,255,0.05)",
                borderRadius:6, border:"1px solid rgba(0,230,255,0.08)" }}/>
            ))}
          </div>
        </div>
        <p style={{ fontFamily:"var(--font-main)", fontSize:"0.65rem", color:"rgba(139,148,158,0.4)", marginTop:8 }}>
          A página pública mostra: capa, informações gerais, galeria de fotos, vídeos e quadro de áreas.
        </p>
      </div>
    </div>
  );
}

