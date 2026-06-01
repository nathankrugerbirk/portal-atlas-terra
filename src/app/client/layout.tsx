import { createClient } from "@/lib/supabase/server";
import { ClientHeader } from "@/components/client/ClientHeader";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let clientName: string | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("auth_user_id", user.id)
      .single();
    clientName = profile?.name;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #000B13 0%, #081320 100%)" }}
    >
      <ClientHeader clientName={clientName} />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
