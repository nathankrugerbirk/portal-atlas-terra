"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  {
    href: "/client",
    label: "Minhas Fazendas",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="3 11 12 2 21 11"/>
        <path d="M5 11v8a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-8"/>
      </svg>
    ),
  },
];

export function ClientSidebar({
  clientName,
  onClose,
}: {
  clientName?: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [signOutHover, setSignOutHover] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "linear-gradient(180deg, #0A1A26 0%, #060E18 100%)",
        borderRight: "1px solid rgba(0,200,217,0.15)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/client" onClick={onClose}>
          <Image
            src="/logo.svg"
            alt="Atlas Terra"
            width={180}
            height={45}
            priority
            style={{ filter: "drop-shadow(0 0 12px rgba(0,200,217,0.15))" }}
          />
        </Link>

        {/* Nome do cliente */}
        {clientName && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,200,217,0.12)", border: "1px solid rgba(0,200,217,0.25)" }}
            >
              <span style={{ color: "#00C8D9", fontSize: "10px", fontWeight: 700 }}>
                {clientName.charAt(0).toUpperCase()}
              </span>
            </div>
            <p
              className="font-montserrat truncate"
              style={{ fontSize: "11px", color: "rgba(107,114,128,0.7)", fontWeight: 500 }}
            >
              {clientName}
            </p>
          </div>
        )}

        {/* Separador gradiente */}
        <div
          style={{
            marginTop: "16px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(0,200,217,0.5) 50%, transparent 100%)",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "6px",
                fontFamily: "'Montserrat', sans-serif",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 500,
                textDecoration: "none",
                transition: "all 200ms ease",
                borderLeft: isActive ? "2px solid #00C8D9" : "2px solid transparent",
                background: isActive ? "rgba(0,200,217,0.08)" : "transparent",
                color: isActive ? "#00C8D9" : "#6B7280",
                paddingLeft: isActive ? "12px" : "14px",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,200,217,0.05)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#6B7280";
                }
              }}
            >
              {isActive && (
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#FF8C42",
                    flexShrink: 0,
                    boxShadow: "0 0 6px rgba(255,140,66,0.6)",
                  }}
                />
              )}
              <span style={{ color: isActive ? "#00C8D9" : "inherit", flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div
        className="p-4"
        style={{ borderTop: "1px solid rgba(0,200,217,0.08)" }}
      >
        <p
          className="font-montserrat text-center mb-3"
          style={{
            fontSize: "9px",
            letterSpacing: "0.14em",
            color: "rgba(107,114,128,0.45)",
            textTransform: "uppercase",
          }}
        >
          Geotecnologia · Dados · Território
        </p>

        <button
          onClick={handleSignOut}
          onMouseEnter={() => setSignOutHover(true)}
          onMouseLeave={() => setSignOutHover(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "9px 14px",
            borderRadius: "6px",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "0.875rem",
            fontWeight: 500,
            background: signOutHover ? "rgba(255,77,77,0.06)" : "transparent",
            color: signOutHover ? "#ff6b6b" : "rgba(107,114,128,0.7)",
            border: signOutHover ? "1px solid rgba(255,77,77,0.25)" : "1px solid transparent",
            cursor: "pointer",
            transition: "all 200ms ease",
            textAlign: "left",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </div>
  );
}
