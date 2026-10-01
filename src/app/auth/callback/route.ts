import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/shared/db/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");

  if (!tokenHash) {
    return NextResponse.redirect(new URL("/?auth=link-invalid", url.origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });

  if (error) {
    return NextResponse.redirect(new URL("/?auth=link-invalid", url.origin));
  }

  return NextResponse.redirect(new URL("/app", url.origin));
}
