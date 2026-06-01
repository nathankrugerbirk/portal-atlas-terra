import { createClient } from "@/lib/supabase/server";
import { ClientLayout } from "@/components/client/ClientLayout";

export default async function ClientRootLayout({ children }: { children: React.ReactNode }) {
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
    <ClientLayout clientName={clientName}>
      {children}
    </ClientLayout>
  );
}
