"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m ? m[1] : null;
}

function fmtHa(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtAlq(v: number) {
  return (v / 2.42).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
}

// ── Paleta do gráfico ────────────────────────────────────────────────────────
const CHART_COLORS = [
  "#00E6FF","#0066AA","#00FFCC","#003388",
  "#44DDFF","#0044CC","#00AA88","#5599FF",
  "#009977","#0088DD","#00CC99","#2255BB",
];

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, index, onClose, onNav }: {
  images: { url: string; title: string }[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  const cur = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNav(index - 1);
      if (e.key === "ArrowRight" && hasNext) onNav(index + 1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [index, hasPrev, hasNext, onClose, onNav]);

  if (!cur) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(5,8,12,0.97)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "90vw" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Exo 2',sans-serif", fontSize: "0.9rem", fontWeight: 600, color: "#F6F8FA" }}>
              {cur.title}
            </span>
            {images.length > 1 && (
              <span style={{ fontFamily: "'Exo 2',sans-serif", fontSize: "0.7rem", color: "#8B949E",
                background: "rgba(139,148,158,0.1)", border: "1px solid rgba(139,148,158,0.2)",
                borderRadius: 4, padding: "2px 8px" }}>
                {index + 1} / {images.length}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.25)",
            borderRadius: 6, color: "#f85149", cursor: "pointer", padding: "4px 12px",
            fontFamily: "'Exo 2',sans-serif", fontSize: "0.75rem",
          }}>✕ Fechar</button>
        </div>
        {/* Imagem + setas */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <NavBtn enabled={hasPrev} dir="left" onClick={() => hasPrev && onNav(index - 1)} />
          <img key={cur.url} src={cur.url} alt={cur.title}
            style={{ flex: 1, maxHeight: "78vh", objectFit: "contain", borderRadius: 8,
              border: "1px solid rgba(0,230,255,0.15)", display: "block", margin: "0 auto" }} />
          <NavBtn enabled={hasNext} dir="right" onClick={() => hasNext && onNav(index + 1)} />
        </div>
        {/* Dots */}
        {images.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
            {images.map((_, i) => (
              <button key={i} onClick={() => onNav(i)} style={{
                width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer",
                padding: 0, transition: "all 0.2s",
                background: i === index ? "#00E6FF" : "rgba(139,148,158,0.3)",
                transform: i === index ? "scale(1.4)" : "scale(1)",
              }} />
            ))}
          </div>
        )}
        <p style={{ textAlign: "center", marginTop: 10, fontFamily: "'Exo 2',sans-serif",
          fontSize: "0.62rem", color: "rgba(139,148,158,0.4)" }}>
          ← → para navegar · ESC para fechar
        </p>
      </div>
    </div>
  );
}

function NavBtn({ enabled, dir, onClick }: { enabled: boolean; dir: "left"|"right"; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={!enabled} style={{
      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
      background: enabled ? "rgba(0,230,255,0.1)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${enabled ? "rgba(0,230,255,0.3)" : "rgba(255,255,255,0.06)"}`,
      color: enabled ? "#00E6FF" : "#2A2F34",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: enabled ? "pointer" : "default", transition: "all 0.2s",
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {dir === "left"
          ? <polyline points="15 18 9 12 15 6"/>
          : <polyline points="9 18 15 12 9 6"/>}
      </svg>
    </button>
  );
}

// ── Gráfico de pizza SVG ─────────────────────────────────────────────────────
function PieChart({ rows, totalHa }: { rows: any[]; totalHa: number }) {
  if (!rows.length || totalHa === 0) return null;
  const cx = 100; const cy = 100; const r = 85;
  let angle = -Math.PI / 2;
  const slices = rows.map((row: any, i: number) => {
    const pct = (row.area_ha || 0) / totalHa;
    const a = pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle); const y1 = cy + r * Math.sin(angle);
    angle += a;
    const x2 = cx + r * Math.cos(angle); const y2 = cy + r * Math.sin(angle);
    return { x1, y1, x2, y2, largeArc: a > Math.PI ? 1 : 0,
      pct, color: CHART_COLORS[i % CHART_COLORS.length],
      label: row.class_name, ha: row.area_ha || 0 };
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 28, marginTop: 24 }}>
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r+6} fill="none" stroke="rgba(0,230,255,0.07)" strokeWidth="1"/>
        {slices.map((s, i) => (
          <g key={i}>
            <path d={`M ${cx},${cy} L ${s.x1},${s.y1} A ${r},${r} 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
              fill={s.color} opacity="0.88" style={{ filter: `drop-shadow(0 0 3px ${s.color}50)` }}/>
            <path d={`M ${cx},${cy} L ${s.x1},${s.y1} A ${r},${r} 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
              fill="none" stroke="rgba(13,17,23,0.6)" strokeWidth="1.5"/>
          </g>
        ))}
        <circle cx={cx} cy={cy} r={r*0.38} fill="#0D1117"/>
        <circle cx={cx} cy={cy} r={r*0.38} fill="none" stroke="rgba(0,230,255,0.1)" strokeWidth="1"/>
        <text x={cx} y={cy-6} textAnchor="middle" fill="#00E6FF"
          style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"13px", fontWeight:700 }}>{rows.length}</text>
        <text x={cx} y={cy+10} textAnchor="middle" fill="#8B949E"
          style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"8px", letterSpacing:"0.08em" }}>CLASSES</text>
      </svg>
      <div style={{ flex: 1, minWidth: 140, display: "flex", flexDirection: "column", gap: 7 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: s.color,
              flexShrink: 0, boxShadow: `0 0 5px ${s.color}60` }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.82rem", color:"#F6F8FA",
                fontWeight: 500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {s.label}
              </p>
              <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.68rem", color:"#8B949E" }}>
                {fmtHa(s.ha)} ha · {fmtPct(s.pct * 100)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hook: scroll reveal ───────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ── Logo oficial (PNG) ───────────────────────────────────────────────────────
function LogoAT() {
  return (
    <img
      src="/logo-brand.png"
      alt="Atlas Terra"
      style={{ height: 36, objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(0,230,255,0.15))" }}
    />
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
interface Props {
  farm: any;
  coverUrl: string | null;
  images: { id: string; title: string; url: string }[];
  videos: any[];
  areaRows: any[];
}

export default function SharePage({ farm, coverUrl, images, videos, areaRows }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Sticky header ao rolar além do hero
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(([e]) => setHeaderVisible(!e.isIntersecting), { threshold: 0 });
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  const totalHa = areaRows.reduce((s: number, r: any) => s + (r.area_ha || 0), 0);
  const totalAlq = totalHa / 2.42;

  const openLightbox = useCallback((i: number) => setLightboxIdx(i), []);

  const s = {
    page: {
      background: "#0D1117",
      minHeight: "100vh",
      fontFamily: "'Exo 2', sans-serif",
      color: "#F6F8FA",
      scrollBehavior: "smooth" as const,
    } as React.CSSProperties,

    stickyHeader: {
      position: "fixed" as const,
      top: 0, left: 0, right: 0,
      zIndex: 100,
      background: "rgba(13,17,23,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(0,230,255,0.1)",
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 24px",
      transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
      transition: "transform 0.3s ease",
    } as React.CSSProperties,

    sectionPad: {
      padding: "72px 24px",
      maxWidth: 960,
      margin: "0 auto",
    } as React.CSSProperties,

    sectionTitle: {
      fontFamily: "'Exo 2', sans-serif",
      fontSize: "0.72rem",
      fontWeight: 700,
      letterSpacing: "0.15em",
      textTransform: "uppercase" as const,
      color: "#00E6FF",
      marginBottom: 24,
    } as React.CSSProperties,

    card: {
      background: "#1A1F24",
      border: "1px solid rgba(0,230,255,0.1)",
      borderRadius: 8,
      padding: 24,
    } as React.CSSProperties,
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>

      <div style={s.page}>

        {/* ── Sticky header ── */}
        <div style={s.stickyHeader}>
          <LogoAT />
          <div style={{ width: 1, height: 22, background: "rgba(0,230,255,0.2)", flexShrink: 0 }}/>
          <span style={{ fontFamily: "'Exo 2',sans-serif", fontWeight: 600, fontSize: "0.9rem",
            color: "#F6F8FA", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {farm.name}
          </span>
        </div>

        {/* ── SEÇÃO 1: Hero ── */}
        <div ref={heroRef} style={{ position: "relative", width: "100%", height: "70vh", minHeight: 420, overflow: "hidden" }}>
          {/* Background */}
          {coverUrl ? (
            <img src={coverUrl} alt={farm.name} style={{
              position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}/>
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, #0D1117 0%, #0A2235 50%, #001133 100%)",
            }}>
              {/* Dot grid */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "radial-gradient(circle, rgba(0,230,255,0.04) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}/>
            </div>
          )}

          {/* Gradiente overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(13,17,23,0.2) 0%, rgba(13,17,23,0.5) 50%, rgba(13,17,23,0.96) 100%)",
          }}/>

          {/* Conteúdo do hero */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
            padding: "0 24px 60px",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "'Exo 2',sans-serif", fontSize: "0.68rem", fontWeight: 600,
              letterSpacing: "0.22em", textTransform: "uppercase", color: "#00E6FF",
              marginBottom: 12, opacity: 0.9,
            }}>
              Propriedade Rural
            </div>
            <h1 style={{
              fontFamily: "'Exo 2',sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800, color: "#FFFFFF",
              lineHeight: 1.1, letterSpacing: "-0.01em",
              textShadow: "0 2px 20px rgba(0,0,0,0.6)",
              marginBottom: 12,
            }}>
              {farm.name}
            </h1>
            <p style={{
              fontFamily: "'Exo 2',sans-serif", fontSize: "1rem", color: "rgba(246,248,250,0.75)",
              letterSpacing: "0.04em", marginBottom: 40,
            }}>
              {farm.city}, {farm.state}
            </p>

            {/* Scroll indicator */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              color: "rgba(246,248,250,0.45)", fontSize: "0.68rem",
              letterSpacing: "0.1em", textTransform: "uppercase",
              animation: "floatDown 1.8s ease-in-out infinite",
            }}>
              <span>Deslize para ver mais</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ── SEÇÃO 2: Informações Gerais ── */}
        <div style={{ ...s.sectionPad, paddingTop: 64 }}>
          <Section>
            <p style={s.sectionTitle}>Informações Gerais</p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16, marginBottom: farm.description ? 24 : 0,
            }}>
              {[
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3h18v18H3z"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
                    </svg>
                  ),
                  label: "Área Total",
                  value: `${fmtHa(farm.total_area_ha)} ha`,
                  sub: `${fmtAlq(farm.total_area_ha)} alqueires`,
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  ),
                  label: "Localização",
                  value: farm.city,
                  sub: farm.state,
                },
              ].map((item, i) => (
                <div key={i} style={{
                  ...s.card,
                  display: "flex", alignItems: "flex-start", gap: 16,
                  transition: "border-color 0.2s",
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 8, flexShrink: 0,
                    background: "rgba(0,230,255,0.08)", color: "#00E6FF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.65rem", fontWeight:600,
                      letterSpacing:"0.1em", textTransform:"uppercase", color:"#8B949E", marginBottom:4 }}>
                      {item.label}
                    </p>
                    <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"1.25rem", fontWeight:700, color:"#00E6FF" }}>
                      {item.value}
                    </p>
                    {item.sub && (
                      <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.8rem", color:"#8B949E", marginTop:2 }}>
                        {item.sub}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Descrição */}
            {farm.description && (
              <div style={{ ...s.card, borderColor: "rgba(0,230,255,0.08)" }}>
                <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.95rem", color:"rgba(246,248,250,0.8)",
                  lineHeight: 1.7, fontWeight: 400 }}>
                  {farm.description}
                </p>
              </div>
            )}
          </Section>
        </div>

        {/* ── SEÇÃO 3: Galeria de Imagens ── */}
        {images.length > 0 && (
          <div style={{ ...s.sectionPad, paddingTop: 0 }}>
            <Section delay={50}>
              <p style={s.sectionTitle}>Galeria de Imagens</p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 10,
              }}>
                {images.map((img, i) => (
                  <div
                    key={img.id}
                    onClick={() => openLightbox(i)}
                    style={{
                      aspectRatio: "4/3", borderRadius: 8, overflow: "hidden",
                      border: "1px solid rgba(0,230,255,0.12)",
                      cursor: "pointer", position: "relative",
                      background: "#1A1F24",
                    }}
                    className="share-img-card"
                  >
                    <img src={img.url} alt={img.title || `Imagem ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover",
                        transition: "transform 0.35s ease" }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    {/* Overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(13,17,23,0.7) 0%, transparent 50%)",
                      display: "flex", alignItems: "flex-end", padding: "10px 12px",
                    }}>
                      {img.title && (
                        <span style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.75rem",
                          color:"rgba(246,248,250,0.8)", overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {img.title}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.65rem", color:"rgba(139,148,158,0.4)",
                marginTop: 10, textAlign:"right" }}>
                Clique em qualquer imagem para ampliar
              </p>
            </Section>
          </div>
        )}

        {/* ── SEÇÃO 4: Vídeos ── */}
        {videos.length > 0 && (
          <div style={{ ...s.sectionPad, paddingTop: 0 }}>
            <Section delay={50}>
              <p style={s.sectionTitle}>Vídeo da Propriedade</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {videos.map((v: any) => {
                  const ytId = getYouTubeId(v.video_url);
                  return (
                    <div key={v.id} style={{ ...s.card, padding: 0, overflow: "hidden" }}>
                      {ytId && (
                        <div style={{ aspectRatio: "16/9" }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            style={{ width: "100%", height: "100%", border: "none" }}
                            allowFullScreen title={v.title}
                          />
                        </div>
                      )}
                      <div style={{ padding: "12px 16px" }}>
                        <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.85rem",
                          fontWeight:600, color:"#F6F8FA" }}>{v.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {/* ── SEÇÃO 5: Quadro de Áreas ── */}
        {areaRows.length > 0 && (
          <div style={{ ...s.sectionPad, paddingTop: 0 }}>
            <Section delay={50}>
              <p style={s.sectionTitle}>Quadro de Áreas</p>

              {/* Cards de totais */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total (ha)", value: fmtHa(totalHa) },
                  { label: "Total (alq)", value: fmtAlq(totalHa) },
                  { label: "Classes", value: areaRows.length },
                ].map((c, i) => (
                  <div key={i} style={{ ...s.card, textAlign: "center" }}>
                    <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"1.3rem",
                      fontWeight:800, color:"#00E6FF" }}>{c.value}</p>
                    <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.62rem",
                      fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase",
                      color:"#8B949E", marginTop:4 }}>{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabela */}
              <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily:"'Exo 2',sans-serif" }}>
                    <thead>
                      <tr>
                        {["Classe", "Área (ha)", "Área (alq)", "%"].map((h) => (
                          <th key={h} style={{
                            background: "rgba(0,230,255,0.05)", color: "#00E6FF",
                            fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.1em",
                            textTransform: "uppercase", padding: "12px 16px", textAlign: "left",
                            borderBottom: "1px solid rgba(0,230,255,0.12)",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {areaRows.map((row: any) => {
                        const alq = (row.area_ha || 0) / 2.42;
                        const pct = totalHa > 0 ? ((row.area_ha || 0) / totalHa) * 100 : 0;
                        return (
                          <tr key={row.id}>
                            <td style={{ padding:"12px 16px", borderBottom:"1px solid rgba(0,230,255,0.06)", color:"#F6F8FA" }}>
                              {row.class_name}
                            </td>
                            <td style={{ padding:"12px 16px", borderBottom:"1px solid rgba(0,230,255,0.06)", color:"#00E6FF", fontVariantNumeric:"tabular-nums" }}>
                              {fmtHa(row.area_ha)}
                            </td>
                            <td style={{ padding:"12px 16px", borderBottom:"1px solid rgba(0,230,255,0.06)", color:"#8B949E", fontVariantNumeric:"tabular-nums" }}>
                              {fmtAlq(row.area_ha)}
                            </td>
                            <td style={{ padding:"12px 16px", borderBottom:"1px solid rgba(0,230,255,0.06)" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ flex:1, maxWidth:60, height:5, borderRadius:3,
                                  background:"rgba(0,230,255,0.1)" }}>
                                  <div style={{ width:`${Math.min(pct,100)}%`, height:"100%",
                                    borderRadius:3, background:"#00E6FF" }}/>
                                </div>
                                <span style={{ color:"#00E6FF", fontSize:"0.8rem", fontVariantNumeric:"tabular-nums" }}>
                                  {fmtPct(pct)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background:"rgba(0,230,255,0.04)", borderTop:"1px solid rgba(0,230,255,0.18)" }}>
                        <td style={{ padding:"12px 16px", fontWeight:700, fontSize:"0.75rem",
                          letterSpacing:"0.08em", textTransform:"uppercase", color:"#F6F8FA" }}>Total</td>
                        <td style={{ padding:"12px 16px", fontWeight:700, color:"#00E6FF", fontVariantNumeric:"tabular-nums" }}>
                          {fmtHa(totalHa)}
                        </td>
                        <td style={{ padding:"12px 16px", fontWeight:600, color:"#8B949E", fontVariantNumeric:"tabular-nums" }}>
                          {fmtAlq(totalHa)}
                        </td>
                        <td style={{ padding:"12px 16px", fontWeight:700, color:"#00E6FF" }}>100,0%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Gráfico */}
              <div style={{ ...s.card, marginTop: 16 }}>
                <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.65rem", fontWeight:600,
                  letterSpacing:"0.1em", textTransform:"uppercase", color:"#8B949E", marginBottom:0 }}>
                  Distribuição por Classe
                </p>
                <PieChart rows={areaRows} totalHa={totalHa}/>
              </div>
            </Section>
          </div>
        )}

        {/* ── SEÇÃO 6: CTA de Contato ── */}
        {(farm.share_contact_link || farm.share_contact_phone) && (
          <div style={{ ...s.sectionPad, paddingTop: 0, paddingBottom: 96 }}>
            <Section delay={50}>
              <div style={{
                background: "linear-gradient(135deg, #0A1A26 0%, #0D1117 100%)",
                border: "1px solid rgba(0,230,255,0.2)",
                borderRadius: 12,
                padding: "48px 36px",
                textAlign: "center",
                boxShadow: "0 0 60px rgba(0,230,255,0.06)",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Dot grid decorativo */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  backgroundImage: "radial-gradient(circle, rgba(0,230,255,0.025) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}/>

                <div style={{ position: "relative" }}>
                  <LogoAT />
                  <h2 style={{
                    fontFamily:"'Exo 2',sans-serif", fontSize:"clamp(1.4rem,3vw,2rem)",
                    fontWeight:800, color:"#FFFFFF", marginTop:20, marginBottom:16,
                    letterSpacing:"-0.01em",
                  }}>
                    Ficou interessado?
                  </h2>
                  <p style={{
                    fontFamily:"'Exo 2',sans-serif", fontSize:"1rem",
                    color:"rgba(246,248,250,0.7)", maxWidth:480, margin:"0 auto 32px",
                    lineHeight:1.7,
                  }}>
                    {farm.share_contact_msg || "Entre em contato conosco para mais informações sobre esta propriedade."}
                  </p>

                  <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                    {farm.share_contact_link && (
                      <a href={farm.share_contact_link} target="_blank" rel="noopener noreferrer"
                        style={{
                          display:"inline-flex", alignItems:"center", gap:8,
                          background:"#00E6FF", color:"#0D1117",
                          fontFamily:"'Exo 2',sans-serif", fontWeight:700, fontSize:"0.85rem",
                          letterSpacing:"0.08em", textTransform:"uppercase",
                          padding:"14px 32px", borderRadius:6, textDecoration:"none",
                          transition:"all 0.2s",
                          boxShadow:"0 0 20px rgba(0,230,255,0.25)",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "#0099AA")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "#00E6FF")}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2.68h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l1.27-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.31z"/>
                        </svg>
                        Entrar em Contato
                      </a>
                    )}
                    {farm.share_contact_phone && (
                      <a href={`tel:${farm.share_contact_phone.replace(/\D/g, "")}`}
                        style={{
                          display:"inline-flex", alignItems:"center", gap:8,
                          background:"transparent", color:"#00E6FF",
                          fontFamily:"'Exo 2',sans-serif", fontWeight:600, fontSize:"0.85rem",
                          letterSpacing:"0.04em",
                          border:"1px solid rgba(0,230,255,0.4)",
                          padding:"14px 28px", borderRadius:6, textDecoration:"none",
                          transition:"all 0.2s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "rgba(0,230,255,0.08)"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        {farm.share_contact_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* Rodapé mínimo */}
        <div style={{
          borderTop: "1px solid rgba(0,230,255,0.07)",
          padding: "24px",
          textAlign: "center",
        }}>
          <p style={{ fontFamily:"'Exo 2',sans-serif", fontSize:"0.68rem",
            color:"rgba(139,148,158,0.35)", letterSpacing:"0.04em" }}>
            © {new Date().getFullYear()} Atlas Terra — Geotecnologia, dados e inteligência territorial
          </p>
        </div>

        {/* Lightbox */}
        {lightboxIdx !== null && (
          <Lightbox
            images={images}
            index={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
            onNav={setLightboxIdx}
          />
        )}

      </div>

      {/* CSS: animação do scroll indicator */}
      <style>{`
        @keyframes floatDown {
          0%, 100% { transform: translateY(0); opacity: 0.45; }
          50% { transform: translateY(6px); opacity: 0.7; }
        }
      `}</style>
    </>
  );
}
