import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleApiError } from "@/lib/api-guards";
import { uploadThemeVariant } from "@/lib/theme-manager";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requirePermission("sessions:manage");
    const formData = await req.formData();
    const folder = formData.get("folder") as string;
    const packName = (formData.get("packName") as string) || folder;
    const variantName = formData.get("name") as string;
    const accent = (formData.get("accent") as string) || "#10b981";
    const file = formData.get("file") as File | null;

    if (!folder || !variantName || !file) {
      return NextResponse.json(
        { error: "Folder name, variant name, and image file are required" },
        { status: 400 }
      );
    }

    // Validate mime type
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPEG, WEBP, and SVG are supported." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadThemeVariant({
      folder,
      packName,
      variantName,
      accent,
      file: buffer,
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      variant: result.variant,
      config: result.config,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
