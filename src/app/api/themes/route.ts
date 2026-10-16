import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleApiError } from "@/lib/api-guards";
import { getThemesConfig, deleteThemeVariant } from "@/lib/theme-manager";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getThemesConfig();
    const activePack = config.packs.find((p) => p.id === config.activePack) || config.packs[0];
    return NextResponse.json({
      activePack: config.activePack,
      packs: config.packs,
      activeVariants: activePack ? activePack.variants : [],
      updatedAt: config.updatedAt,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission("sessions:manage");
    const { packId, variantId } = await req.json();
    if (!packId || !variantId) {
      return NextResponse.json({ error: "Missing packId or variantId" }, { status: 400 });
    }

    const updatedConfig = await deleteThemeVariant(packId, variantId);
    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (err) {
    return handleApiError(err);
  }
}
