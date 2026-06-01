import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Verificar se o solicitante é admin
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

    // Processar criação
    const body = await request.json();
    const { name, username, password, notes } = body;

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes" },
        { status: 400 }
      );
    }

    // Criar usuário via service_role (nunca exposto ao frontend)
    const adminClient = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const domain = process.env.INTERNAL_EMAIL_DOMAIN || "atlasterra.portal";
    const email = `${username.toLowerCase().trim()}@${domain}`;

    // Verificar se username já existe
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase().trim())
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: "Este username já está em uso" },
        { status: 409 }
      );
    }

    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError || !newUser.user) {
      return NextResponse.json(
        { error: createError?.message || "Erro ao criar usuário" },
        { status: 500 }
      );
    }

    // Criar profile
    const { data: newProfile, error: profileError } = await adminClient
      .from("profiles")
      .insert({
        auth_user_id: newUser.user.id,
        name,
        username: username.toLowerCase().trim(),
        role: "client",
        status: "active",
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: deletar usuário auth
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: "Erro ao criar perfil" },
        { status: 500 }
      );
    }

    // Criar registro de cliente
    const { data: client, error: clientError } = await adminClient
      .from("clients")
      .insert({
        profile_id: newProfile.id,
        name,
        notes: notes || null,
      })
      .select()
      .single();

    if (clientError) {
      return NextResponse.json(
        { error: "Usuário criado mas falha ao criar registro de cliente" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: newProfile,
      client,
    });
  } catch (err) {
    console.error("create-user error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
