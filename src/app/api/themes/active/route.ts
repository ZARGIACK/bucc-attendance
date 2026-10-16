import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleApiError } from "@/lib/api-guards";
import { setActiveThemePack } from "@/lib/theme-manager";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requirePermission("sessions:manage");
    const { activePackId } = await req.json();
    if (!activePackId) {
      return NextResponse.json({ error: "Missing activePackId" }, { status: 400 });
    }

    const updatedConfig = await setActiveThemePack(activePackId);
    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (err) {
    return handleApiError(err);
  }
}
