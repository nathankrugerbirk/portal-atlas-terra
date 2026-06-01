import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { auth_user_id, profile_id } = body;

    if (!auth_user_id || !profile_id) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 }
      );
    }

    const adminClient = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Deletar registro de cliente (cascade para fazendas via FK)
    await adminClient.from("clients").delete().eq("profile_id", profile_id);

    // Deletar profile
    await adminClient.from("profiles").delete().eq("id", profile_id);

    // Deletar usuário auth
    const { error } = await adminClient.auth.admin.deleteUser(auth_user_id);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao deletar usuário auth: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete-user error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
