"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#05080C" }}
    >
      {/* ── Curvas de nível topográficas (SVG fullscreen) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.07 }}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Família de elipses concêntricas — grupo central */}
        <ellipse cx="50%" cy="48%" rx="46%" ry="30%" fill="none" stroke="#00E6FF" strokeWidth="0.7"/>
        <ellipse cx="50%" cy="48%" rx="40%" ry="25%" fill="none" stroke="#00E6FF" strokeWidth="0.7"/>
        <ellipse cx="50%" cy="48%" rx="34%" ry="21%" fill="none" stroke="#00E6FF" strokeWidth="0.7"/>
        <ellipse cx="50%" cy="48%" rx="28%" ry="17%" fill="none" stroke="#00E6FF" strokeWidth="0.7"/>
        <ellipse cx="50%" cy="48%" rx="22%" ry="13%" fill="none" stroke="#00E6FF" strokeWidth="0.7"/>
        <ellipse cx="50%" cy="48%" rx="16%" ry="9%"  fill="none" stroke="#00E6FF" strokeWidth="0.7"/>
        <ellipse cx="50%" cy="48%" rx="10%" ry="5.5%"fill="none" stroke="#00E6FF" strokeWidth="0.7"/>
        <ellipse cx="50%" cy="48%" rx="5%"  ry="2.5%"fill="none" stroke="#00E6FF" strokeWidth="0.6"/>
        {/* Grupo secundário — canto inferior esquerdo */}
        <ellipse cx="12%" cy="82%" rx="22%" ry="15%" fill="none" stroke="#00E6FF" strokeWidth="0.5"/>
        <ellipse cx="12%" cy="82%" rx="16%" ry="10%" fill="none" stroke="#00E6FF" strokeWidth="0.5"/>
        <ellipse cx="12%" cy="82%" rx="10%" ry="6%"  fill="none" stroke="#00E6FF" strokeWidth="0.5"/>
        {/* Grupo terciário — canto superior direito */}
        <ellipse cx="88%" cy="18%" rx="20%" ry="14%" fill="none" stroke="#00E6FF" strokeWidth="0.5"/>
        <ellipse cx="88%" cy="18%" rx="14%" ry="9%"  fill="none" stroke="#00E6FF" strokeWidth="0.5"/>
        <ellipse cx="88%" cy="18%" rx="8%"  ry="5%"  fill="none" stroke="#00E6FF" strokeWidth="0.5"/>
        {/* Linhas de cota horizontais */}
        <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#00E6FF" strokeWidth="0.3" strokeDasharray="6 18"/>
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#00E6FF" strokeWidth="0.3" strokeDasharray="6 18"/>
        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#00E6FF" strokeWidth="0.3" strokeDasharray="6 18"/>
      </svg>

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(0,230,255,0.025) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      }}/>

      {/* Brilho radial topo */}
      <div className="absolute pointer-events-none" style={{
        top: "-8%", left: "50%", transform: "translateX(-50%)",
        width: "700px", height: "350px",
        background: "radial-gradient(ellipse at center, rgba(0,230,255,0.07) 0%, transparent 70%)",
      }}/>

      {/* ── Card de login ── */}
      <div className="relative z-10 w-full animate-slide-up" style={{ maxWidth: 420, padding: "0 24px" }}>
        <div style={{
          background: "rgba(26,31,36,0.97)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(0,230,255,0.15)",
          borderRadius: "8px",
          padding: "44px 40px 40px",
          boxShadow: "0 0 60px rgba(0,230,255,0.07), 0 32px 80px rgba(0,0,0,0.7)",
        }}>

          {/* Logo oficial */}
          <div className="flex justify-center mb-6 animate-float">
            <Image
              src="/logo-brand.png"
              alt="Atlas Terra"
              width={260}
              height={130}
              priority
              style={{
                objectFit: "contain",
                filter: "drop-shadow(0 0 18px rgba(0,230,255,0.2))",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Separador com glow */}
          <div style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(0,153,170,0.6), transparent)",
            boxShadow: "0 0 8px rgba(0,153,170,0.3)",
            marginBottom: "28px",
          }}/>

          {/* Tag acesso restrito */}
          <p style={{
            fontFamily: "var(--font-main)",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(139,148,158,0.5)",
            textAlign: "center",
            marginBottom: "24px",
          }}>
            ÁREA PRIVADA — ACESSO RESTRITO
          </p>

          {/* Formulário */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
              <label style={{
                display: "block", fontFamily: "var(--font-main)", fontSize: "0.65rem",
                fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--color-text-muted)", marginBottom: "6px",
              }}>Usuário</label>
              <input
                type="text" autoComplete="username" placeholder="Digite seu usuário"
                value={username} onChange={(e) => setUsername(e.target.value)}
                required disabled={loading}
                style={{
                  width: "100%", background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-surface)", borderRadius: "4px",
                  padding: "11px 14px", color: "var(--color-text-primary)",
                  fontFamily: "var(--font-main)", fontSize: "0.9rem",
                  outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
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

            <div>
              <label style={{
                display: "block", fontFamily: "var(--font-main)", fontSize: "0.65rem",
                fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--color-text-muted)", marginBottom: "6px",
              }}>Senha</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: "100%", background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-surface)", borderRadius: "4px",
                    padding: "11px 44px 11px 14px", color: "var(--color-text-primary)",
                    fontFamily: "var(--font-main)", fontSize: "0.9rem",
                    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
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
                {/* Botão mostrar/ocultar senha */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: showPassword ? "var(--color-primary)" : "var(--color-text-muted)",
                    padding: 0, display: "flex", alignItems: "center",
                    transition: "color 0.2s",
                  }}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    /* Olho fechado */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    /* Olho aberto */
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.25)",
                borderRadius: "4px", padding: "10px 14px", color: "#f85149",
                fontFamily: "var(--font-main)", fontSize: "0.82rem",
              }}>{error}</div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%",
                background: loading ? "rgba(0,230,255,0.3)" : "var(--color-primary)",
                color: "var(--color-bg-deep)", fontFamily: "var(--font-main)",
                fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.12em",
                textTransform: "uppercase", padding: "12px 24px", borderRadius: "4px",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                marginTop: "4px", transition: "background 0.2s, box-shadow 0.2s",
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

        <p className="text-center mt-5" style={{
          fontFamily: "var(--font-main)", fontSize: "0.65rem",
          letterSpacing: "0.06em", color: "rgba(139,148,158,0.35)",
        }}>
          © 2026 Atlas Terra — Geotecnologia, dados e inteligência territorial
        </p>
      </div>
    </div>
  );
}
