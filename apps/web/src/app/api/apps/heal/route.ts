import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { healNginx } from "@/lib/nginx-heal"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const result = healNginx()

  return NextResponse.json({
    ok:      true,
    fixed:   result.fixed,
    details: result.details,
    error:   result.error,
  })
}
