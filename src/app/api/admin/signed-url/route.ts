import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

/** Gera URL assinada temporária para arquivo privado */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { bucket, path, expiresIn = 3600 } = body;

    if (!bucket || !path) {
      return NextResponse.json({ error: "bucket e path são obrigatórios" }, { status: 400 });
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error || !data) {
      return NextResponse.json({ error: "Erro ao gerar URL assinada" }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (err) {
    console.error("signed-url error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
