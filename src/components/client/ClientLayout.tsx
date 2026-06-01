"use client";

import { useState } from "react";
import { ClientSidebar } from "./ClientSidebar";

export function ClientLayout({
  children,
  clientName,
}: {
  children: React.ReactNode;
  clientName?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0A1A26" }}
    >
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0">
        <ClientSidebar clientName={clientName} />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(6,14,24,0.85)" }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-60"
            onClick={(e) => e.stopPropagation()}
          >
            <ClientSidebar
              clientName={clientName}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header
          className="lg:hidden flex items-center gap-4 px-4 h-14 flex-shrink-0"
          style={{
            borderBottom: "1px solid rgba(0,200,217,0.1)",
            background: "#0A1A26",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ color: "#6B7280" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="font-orbitron font-bold text-sm" style={{ color: "#00C8D9" }}>
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
