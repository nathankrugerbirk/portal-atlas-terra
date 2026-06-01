"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ClientHeader({ clientName }: { clientName?: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="flex items-center justify-between px-6 h-16 flex-shrink-0"
      style={{
        background: "#000B13",
        borderBottom: "1px solid rgba(0,225,255,0.1)",
        boxShadow: "0 1px 20px rgba(0,225,255,0.05)",
      }}
    >
      <Image src="/logo.svg" alt="Atlas Terra" width={160} height={40} priority />

      <div className="flex items-center gap-4">
        {clientName && (
          <span
            className="font-montserrat text-sm hidden sm:block"
            style={{ color: "#8BA3B5" }}
          >
            {clientName}
          </span>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 font-montserrat text-xs font-600 px-3 py-2 rounded border transition-colors"
          style={{ color: "rgba(255,100,100,0.7)", borderColor: "rgba(255,100,100,0.2)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </header>
  );
}
