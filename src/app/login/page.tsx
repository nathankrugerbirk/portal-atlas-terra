"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/* ── Logo 3 camadas (exclusiva da tela de login) ───────────────────── */
function AtlasLogoComplex() {
  return (
    <div className="animate-float" style={{ width: 200, height: 160, position: "relative", margin: "0 auto" }}>
      <svg
        viewBox="0 0 200 160"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 14px rgba(0,230,255,0.35))" }}
      >
        {/* ── Camada inferior: mapa topográfico ── */}
        <g transform="translate(20, 95) skewX(-20) skewY(8) scale(1, 0.55)">
          <rect x="0" y="0" width="160" height="100" rx="2" fill="#1A1F24" stroke="#2B3138" strokeWidth="1"/>
          {/* Curvas topográficas */}
          <ellipse cx="80" cy="50" rx="72" ry="42" fill="none" stroke="#2B3138" strokeWidth="0.8"/>
          <ellipse cx="80" cy="50" rx="56" ry="32" fill="none" stroke="#2B3138" strokeWidth="0.8"/>
          <ellipse cx="80" cy="50" rx="40" ry="22" fill="none" stroke="#2B3138" strokeWidth="0.8"/>
          <ellipse cx="80" cy="50" rx="24" ry="13" fill="none" stroke="#2B3138" strokeWidth="0.8"/>
          <ellipse cx="80" cy="50" rx="10" ry="6"  fill="none" stroke="#3A3F44" strokeWidth="0.7"/>
        </g>

        {/* ── Camada do meio: grid iluminado ── */}
        <g transform="translate(12, 62) skewX(-20) skewY(8) scale(1, 0.55)">
          <rect x="0" y="0" width="160" height="100" rx="2"
            fill="rgba(0,153,170,0.18)" stroke="#00E6FF" strokeWidth="1.2"/>
          {/* Grid horizontal */}
          {[20,40,60,80].map(y => (
            <line key={y} x1="0" y1={y} x2="160" y2={y} stroke="rgba(0,230,255,0.2)" strokeWidth="0.6"/>
          ))}
          {/* Grid vertical */}
          {[32,64,96,128].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="rgba(0,230,255,0.2)" strokeWidth="0.6"/>
          ))}
          {/* Brilho nas bordas */}
          <rect x="0" y="0" width="160" height="100" rx="2"
            fill="none" stroke="rgba(0,230,255,0.6)" strokeWidth="0.5"/>
        </g>

        {/* ── Camada superior: mapa-múndi em pontos ── */}
        <g transform="translate(4, 28) skewX(-20) skewY(8) scale(1, 0.55)">
          <rect x="0" y="0" width="160" height="100" rx="2"
            fill="rgba(13,17,23,0.92)" stroke="#0099AA" strokeWidth="1"/>
          {/* Pontos do mapa-múndi */}
          {[
            [20,30],[28,28],[36,26],[44,28],[52,26],[60,28],[68,26],[76,28],[84,26],[92,28],
            [100,26],[108,28],[116,26],[124,28],[132,26],[140,28],[148,30],
            [16,38],[24,36],[32,34],[40,36],[48,34],[56,36],[64,34],[72,36],[80,34],
            [88,36],[96,34],[104,36],[112,34],[120,36],[128,34],[136,36],[144,34],[152,36],
            [20,46],[28,44],[36,42],[44,44],[52,42],[60,44],[68,42],[76,44],[84,42],
            [92,44],[100,42],[108,44],[116,42],[124,44],[132,42],[140,44],[148,42],
            [24,54],[32,52],[40,54],[48,52],[56,54],[64,52],[72,54],[80,52],[88,54],
            [96,52],[104,54],[112,52],[120,54],[128,52],[136,54],[144,52],
            [28,62],[36,60],[44,62],[52,60],[60,62],[68,60],[76,62],[84,60],[92,62],
            [100,60],[108,62],[116,60],[124,62],[132,60],[140,62],
            [32,70],[40,68],[48,70],[56,68],[64,70],[72,68],[80,70],[88,68],[96,70],
            [104,68],[112,70],[120,68],[128,70],[136,68],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.2" fill="rgba(246,248,250,0.35)"/>
          ))}
          {/* Pins / marcadores com brilho ciano */}
          {[[40,40],[80,32],[120,38],[60,58],[100,50]].map(([cx,cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="3.5" fill="#00E6FF" opacity="0.9"/>
              <circle cx={cx} cy={cy} r="6" fill="none" stroke="#00E6FF" strokeWidth="0.8" opacity="0.4"/>
              <line x1={cx} y1={cy} x2={cx} y2={cy - 14} stroke="#00E6FF" strokeWidth="0.8" opacity="0.7"/>
            </g>
          ))}
          <rect x="0" y="0" width="160" height="100" rx="2"
            fill="none" stroke="#0099AA" strokeWidth="0.5"/>
        </g>
      </svg>
    </div>
  );
}

/* ── Página de login ────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const email = `${username.toLowerCase().trim()}@atlasterra.portal`;
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) { setError("Usuário ou senha incorretos."); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Erro ao obter dados do usuário."); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("auth_user_id", user.id)
        .single();

      if (!profile) { setError("Perfil não encontrado. Contate o administrador."); return; }
      if (profile.status === "inactive") {
        await supabase.auth.signOut();
        setError("Sua conta está inativa. Contate o administrador.");
        return;
      }

      router.push(profile.role === "admin" ? "/admin" : "/client");
      router.refresh();
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden contour-bg"
      style={{ background: "var(--color-bg-deep)" }}
    >
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(0,230,255,0.025) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}/>

      {/* Glow radial superior */}
      <div className="absolute pointer-events-none" style={{
        top: "-5%", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "300px",
        background: "radial-gradient(ellipse at center, rgba(0,230,255,0.08) 0%, transparent 70%)",
      }}/>

      {/* Card de login */}
      <div className="relative z-10 w-full animate-slide-up" style={{ maxWidth: 420, padding: "0 24px" }}>
        <div style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-bg-elevated)",
          borderRadius: "8px",
          padding: "48px 40px",
          boxShadow: "0 0 40px rgba(0,230,255,0.08), 0 24px 64px rgba(0,0,0,0.6)",
        }}>

          {/* Logo 3 camadas */}
          <AtlasLogoComplex />

          {/* Título */}
          <div className="text-center mt-6 mb-6">
            <h1 style={{
              fontFamily: "var(--font-main)",
              fontWeight: 600,
              fontSize: "1.4rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--color-text-primary)",
            }}>
              ATLAS TERRA
            </h1>
            <p style={{
              fontFamily: "var(--font-main)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              color: "var(--color-text-muted)",
              marginTop: "4px",
              textTransform: "uppercase",
            }}>
              See the World. Build the Future.
            </p>
          </div>

          {/* Separador com glow */}
          <div style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, var(--color-secondary), transparent)",
            boxShadow: "0 0 8px rgba(0,153,170,0.4)",
            marginBottom: "28px",
          }}/>

          {/* Formulário */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Usuário */}
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-main)",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                marginBottom: "6px",
              }}>Usuário</label>
              <input
                type="text"
                autoComplete="username"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-surface)",
                  borderRadius: "4px",
                  padding: "11px 14px",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-main)",
                  fontSize: "0.9rem",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-primary)";
                  e.target.style.boxShadow = "0 0 0 3px var(--color-glow)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-surface)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Senha */}
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-main)",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                marginBottom: "6px",
              }}>Senha</label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-surface)",
                  borderRadius: "4px",
                  padding: "11px 14px",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-main)",
                  fontSize: "0.9rem",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-primary)";
                  e.target.style.boxShadow = "0 0 0 3px var(--color-glow)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-surface)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Erro */}
            {error && (
              <div style={{
                background: "rgba(248,81,73,0.08)",
                border: "1px solid rgba(248,81,73,0.25)",
                borderRadius: "4px",
                padding: "10px 14px",
                color: "#f85149",
                fontFamily: "var(--font-main)",
                fontSize: "0.82rem",
              }}>
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "rgba(0,230,255,0.3)" : "var(--color-primary)",
                color: "var(--color-bg-deep)",
                fontFamily: "var(--font-main)",
                fontWeight: 700,
                fontSize: "0.78rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "12px 24px",
                borderRadius: "4px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "4px",
                transition: "background 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.target as HTMLButtonElement).style.background = "var(--color-secondary)";
                  (e.target as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(0,230,255,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.target as HTMLButtonElement).style.background = "var(--color-primary)";
                  (e.target as HTMLButtonElement).style.boxShadow = "none";
                }
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <svg className="animate-spin" width="15" height="15" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Verificando...
                </span>
              ) : "Entrar"}
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <p className="text-center mt-5" style={{
          fontFamily: "var(--font-main)",
          fontSize: "0.65rem",
          letterSpacing: "0.06em",
          color: "rgba(139,148,158,0.4)",
        }}>
          © 2026 Atlas Terra — Geotecnologia, dados e inteligência territorial
        </p>
      </div>
    </div>
  );
}
