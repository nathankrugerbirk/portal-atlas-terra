"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/admin/clients",
    label: "Clientes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="3 11 12 2 21 11"/><path d="M5 11v8a1 1 0 0 0 1 1h4v-4h4v4h4a1 1 0 0 0 1-1v-8"/>
      </svg>
    ),
  },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "#000B13", borderRight: "1px solid rgba(0,225,255,0.1)" }}
    >
      {/* Logo */}
      <div className="p-5 pb-4" style={{ borderBottom: "1px solid rgba(0,225,255,0.08)" }}>
        <Link href="/admin" onClick={onClose}>
          <Image src="/logo.svg" alt="Atlas Terra" width={180} height={45} priority />
        </Link>
        <p
          className="font-montserrat text-xs mt-2 tracking-widest uppercase"
          style={{ color: "rgba(139,163,181,0.5)" }}
        >
          Painel Administrativo
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sair */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(0,225,255,0.08)" }}>
        <button onClick={handleSignOut} className="sidebar-link w-full" style={{ color: "rgba(255,100,100,0.7)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
