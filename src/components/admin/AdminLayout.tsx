"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg-deep)" }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0">
        <AdminSidebar />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(13,17,23,0.85)" }}
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute left-0 top-0 h-full w-60" onClick={(e) => e.stopPropagation()}>
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header className="lg:hidden flex items-center gap-4 px-4 h-14 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,230,255,0.08)", background: "var(--color-bg-card)" }}
        >
          <button onClick={() => setSidebarOpen(true)} style={{ color: "#8B949E" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: "0.875rem", color: "#00E6FF", letterSpacing: "0.12em" }}>
            ATLAS TERRA
          </span>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
