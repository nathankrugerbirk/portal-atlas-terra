"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/admin/clients",
    label: "Clientes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: "/admin/farms",
    label: "Fazendas",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="3 11 12 2 21 11"/>
        <path d="M5 11v8a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-8"/>
      </svg>
    ),
  },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
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
    <div className="flex flex-col h-full" style={{
      background: "var(--color-bg-card)",
      borderRight: "1px solid rgba(0,230,255,0.1)",
    }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/admin" onClick={onClose}>
          <Image src="/logo-brand.png" alt="Atlas Terra" width={175} height={88} priority
            style={{ objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(0,230,255,0.15))" }}
          />
        </Link>
        <p style={{
          fontFamily: "var(--font-main)",
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(139,148,158,0.5)",
          marginTop: "10px",
        }}>
          Painel Administrativo
        </p>
        <div style={{
          marginTop: "14px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(0,230,255,0.4), transparent)",
        }}/>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 14px",
                borderRadius: "4px",
                fontFamily: "var(--font-main)",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 500,
                textDecoration: "none",
                transition: "all 200ms ease",
                borderLeft: isActive ? "2px solid #00E6FF" : "2px solid transparent",
                background: isActive ? "rgba(0,230,255,0.08)" : "transparent",
                color: isActive ? "#00E6FF" : "#8B949E",
                paddingLeft: isActive ? "12px" : "14px",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,230,255,0.05)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#F6F8FA";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#8B949E";
                }
              }}
            >
              {isActive && (
                <span style={{
                  width: "4px", height: "4px", borderRadius: "50%",
                  background: "#00E6FF", flexShrink: 0,
                  boxShadow: "0 0 6px rgba(0,230,255,0.7)",
                }}/>
              )}
              <span style={{ color: isActive ? "#00E6FF" : "inherit", flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(0,230,255,0.07)" }}>
        <p style={{
          fontFamily: "var(--font-main)",
          fontSize: "9px",
          letterSpacing: "0.12em",
          color: "rgba(139,148,158,0.4)",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: "10px",
        }}>
          Geotecnologia · Dados · Território
        </p>
        <button
          onClick={handleSignOut}
          onMouseEnter={() => setSignOutHover(true)}
          onMouseLeave={() => setSignOutHover(false)}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            width: "100%", padding: "9px 14px", borderRadius: "4px",
            fontFamily: "var(--font-main)", fontSize: "0.875rem", fontWeight: 500,
            background: signOutHover ? "rgba(248,81,73,0.06)" : "transparent",
            color: signOutHover ? "#f85149" : "rgba(139,148,158,0.6)",
            border: signOutHover ? "1px solid rgba(248,81,73,0.25)" : "1px solid transparent",
            cursor: "pointer", transition: "all 200ms ease", textAlign: "left",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
