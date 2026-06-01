"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#081320" }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0">
        <AdminSidebar />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,7,15,0.8)" }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-60"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header
          className="lg:hidden flex items-center gap-4 px-4 h-14 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,225,255,0.1)", background: "#000B13" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-atlas-gray-text hover:text-atlas-cyan transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="font-orbitron font-bold text-sm" style={{ color: "#00E1FF" }}>
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
