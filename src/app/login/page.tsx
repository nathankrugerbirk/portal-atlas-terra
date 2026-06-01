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

      // Montar email interno a partir do username
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

      // Buscar role do usuário
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
      className="min-h-screen flex items-center justify-center contour-bg"
      style={{ background: "linear-gradient(135deg, #000B13 0%, #081320 60%, #0D1E2C 100%)" }}
    >
      {/* Glow central decorativo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,225,255,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6 animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image
            src="/logo.svg"
            alt="Atlas Terra"
            width={280}
            height={70}
            priority
            className="drop-shadow-[0_0_20px_rgba(0,225,255,0.3)]"
          />
        </div>

        {/* Card de login */}
        <div
          className="atlas-card p-8"
          style={{
            boxShadow:
              "0 0 40px rgba(0,225,255,0.08), 0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <p
            className="font-montserrat text-xs font-semibold tracking-widest uppercase text-center mb-8"
            style={{ color: "rgba(139,163,181,0.7)" }}
          >
            Área Privada — Acesso Restrito
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="atlas-label">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="atlas-input"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="atlas-label">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="atlas-input"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div
                className="rounded-md p-3 text-sm font-montserrat"
                style={{
                  background: "rgba(255,77,77,0.08)",
                  border: "1px solid rgba(255,77,77,0.25)",
                  color: "#ff8080",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-atlas-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
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
          className="text-center mt-6 font-montserrat text-xs"
          style={{ color: "rgba(139,163,181,0.4)" }}
        >
          © {new Date().getFullYear()} Atlas Terra — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
