"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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
      const domain = "atlasterra.portal";
      const email = `${username.toLowerCase().trim()}@${domain}`;

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Usuário ou senha incorretos. Verifique seus dados.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Erro ao obter dados do usuário.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("auth_user_id", user.id)
        .single();

      if (!profile) {
        setError("Perfil não encontrado. Contate o administrador.");
        return;
      }

      if (profile.status === "inactive") {
        await supabase.auth.signOut();
        setError("Sua conta está inativa. Contate o administrador.");
        return;
      }

      if (profile.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/client");
      }

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
      style={{ background: "linear-gradient(160deg, #0A1A26 0%, #060E18 100%)" }}
    >
      {/* Padrão de pontos — dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(0,200,217,0.03) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Brilho radial ciano superior */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(0,200,217,0.1) 0%, transparent 70%)",
        }}
      />

      {/* Curvas de nível topográficas em SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.05 }}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="50%" cy="50%" rx="45%" ry="30%" fill="none" stroke="#00C8D9" strokeWidth="0.8" />
        <ellipse cx="50%" cy="50%" rx="38%" ry="24%" fill="none" stroke="#00C8D9" strokeWidth="0.8" />
        <ellipse cx="50%" cy="50%" rx="30%" ry="18%" fill="none" stroke="#00C8D9" strokeWidth="0.8" />
        <ellipse cx="50%" cy="50%" rx="22%" ry="12%" fill="none" stroke="#00C8D9" strokeWidth="0.8" />
        <ellipse cx="50%" cy="50%" rx="14%" ry="7%" fill="none" stroke="#00C8D9" strokeWidth="0.8" />
        <ellipse cx="20%" cy="75%" rx="25%" ry="18%" fill="none" stroke="#00C8D9" strokeWidth="0.6" />
        <ellipse cx="80%" cy="25%" rx="20%" ry="14%" fill="none" stroke="#00C8D9" strokeWidth="0.6" />
      </svg>

      {/* Conteúdo principal */}
      <div className="relative z-10 w-full max-w-md px-6 animate-slide-up">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image
            src="/logo.svg"
            alt="Atlas Terra"
            width={260}
            height={65}
            priority
            style={{ filter: "drop-shadow(0 0 24px rgba(0,200,217,0.25))" }}
          />
        </div>

        {/* Card de login */}
        <div
          style={{
            background: "rgba(17,24,32,0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(0,200,217,0.2)",
            borderRadius: "8px",
            boxShadow: "0 0 60px rgba(0,200,217,0.08), 0 24px 64px rgba(0,0,0,0.6)",
            padding: "40px 36px",
          }}
        >
          {/* Tag de acesso restrito */}
          <p
            className="font-orbitron text-center mb-8"
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#6B7280",
            }}
          >
            ÁREA PRIVADA — ACESSO RESTRITO
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Campo usuário */}
            <div>
              <label
                htmlFor="username"
                style={{
                  display: "block",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#6B7280",
                  marginBottom: "6px",
                }}
              >
                Usuário
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(0,200,217,0.2)",
                  borderRadius: "6px",
                  padding: "11px 14px",
                  color: "#FFFFFF",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(0,200,217,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0,200,217,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(0,200,217,0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Campo senha */}
            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#6B7280",
                  marginBottom: "6px",
                }}
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(0,200,217,0.2)",
                  borderRadius: "6px",
                  padding: "11px 14px",
                  color: "#FFFFFF",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(0,200,217,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0,200,217,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(0,200,217,0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Erro */}
            {error && (
              <div
                style={{
                  background: "rgba(255,77,77,0.08)",
                  border: "1px solid rgba(255,77,77,0.25)",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  color: "#ff8080",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.8rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading
                  ? "rgba(0,200,217,0.3)"
                  : "linear-gradient(135deg, #009AAA 0%, #00C8D9 100%)",
                color: "#0A1A26",
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: "0.8rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "12px 24px",
                borderRadius: "6px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "8px",
                transition: "opacity 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.target as HTMLButtonElement).style.opacity = "0.9";
                  (e.target as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0,200,217,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "1";
                (e.target as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <p
          className="text-center mt-6 font-montserrat"
          style={{
            fontSize: "0.7rem",
            color: "rgba(107,114,128,0.5)",
            letterSpacing: "0.04em",
          }}
        >
          © 2026 Atlas Terra — Geotecnologia, dados e inteligência territorial
        </p>
      </div>
    </div>
  );
}
